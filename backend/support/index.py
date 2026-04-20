"""
Чат поддержки: пользователи пишут обращения, администратор отвечает.
Действия: get_or_create_chat | send_message | get_messages | get_all_chats | close_chat
"""
import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data: dict, status: int = 200):
    return {"statusCode": status, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def err(msg: str, status: int = 400):
    return {"statusCode": status, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def get_user_by_token(cur, token: str):
    cur.execute(
        "SELECT u.id, u.name, u.email, u.is_admin FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "email": row[2], "is_admin": row[3]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    token = event.get("headers", {}).get("X-Session-Token", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    action = body.get("action") or event.get("queryStringParameters", {}).get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    user = get_user_by_token(cur, token)
    if not user:
        cur.close()
        conn.close()
        return err("Не авторизован", 401)

    # Получить или создать чат для текущего пользователя
    if action == "get_or_create_chat":
        cur.execute(
            "SELECT id, status FROM support_chats WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
            (user["id"],)
        )
        row = cur.fetchone()
        if row and row[1] == "open":
            chat_id = row[0]
        else:
            cur.execute(
                "INSERT INTO support_chats (user_id) VALUES (%s) RETURNING id",
                (user["id"],)
            )
            chat_id = cur.fetchone()[0]
            conn.commit()
        cur.close()
        conn.close()
        return ok({"chat_id": chat_id})

    # Отправить сообщение
    if action == "send_message":
        chat_id = body.get("chat_id")
        text = body.get("text", "").strip()
        if not chat_id or not text:
            cur.close()
            conn.close()
            return err("chat_id и text обязательны")

        # Проверяем доступ к чату
        if user["is_admin"]:
            cur.execute("SELECT id FROM support_chats WHERE id = %s", (chat_id,))
        else:
            cur.execute("SELECT id FROM support_chats WHERE id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return err("Чат не найден", 404)

        cur.execute(
            "INSERT INTO support_messages (chat_id, sender_id, is_admin, text) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
            (chat_id, user["id"], user["is_admin"], text)
        )
        msg_id, created_at = cur.fetchone()
        cur.execute("UPDATE support_chats SET updated_at = now(), status = 'open' WHERE id = %s", (chat_id,))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"id": msg_id, "text": text, "is_admin": user["is_admin"], "created_at": str(created_at)})

    # Получить сообщения чата
    if action == "get_messages":
        chat_id = body.get("chat_id") or event.get("queryStringParameters", {}).get("chat_id")
        if not chat_id:
            cur.close()
            conn.close()
            return err("chat_id обязателен")

        chat_id = int(chat_id)
        if user["is_admin"]:
            cur.execute("SELECT id FROM support_chats WHERE id = %s", (chat_id,))
        else:
            cur.execute("SELECT id FROM support_chats WHERE id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return err("Чат не найден", 404)

        cur.execute(
            "SELECT m.id, m.text, m.is_admin, m.created_at, u.name FROM support_messages m JOIN users u ON u.id = m.sender_id WHERE m.chat_id = %s ORDER BY m.created_at ASC",
            (chat_id,)
        )
        rows = cur.fetchall()
        messages = [{"id": r[0], "text": r[1], "is_admin": r[2], "created_at": str(r[3]), "sender_name": r[4]} for r in rows]
        cur.close()
        conn.close()
        return ok({"messages": messages})

    # Получить все чаты (только для админа)
    if action == "get_all_chats":
        if not user["is_admin"]:
            cur.close()
            conn.close()
            return err("Нет доступа", 403)

        cur.execute(
            """SELECT sc.id, sc.status, sc.created_at, sc.updated_at, u.name, u.email,
               (SELECT text FROM support_messages WHERE chat_id = sc.id ORDER BY created_at DESC LIMIT 1) as last_msg,
               (SELECT COUNT(*) FROM support_messages WHERE chat_id = sc.id) as msg_count
               FROM support_chats sc JOIN users u ON u.id = sc.user_id
               ORDER BY sc.updated_at DESC"""
        )
        rows = cur.fetchall()
        chats = [{"id": r[0], "status": r[1], "created_at": str(r[2]), "updated_at": str(r[3]),
                  "user_name": r[4], "user_email": r[5], "last_message": r[6], "message_count": r[7]} for r in rows]
        cur.close()
        conn.close()
        return ok({"chats": chats})

    # Закрыть чат (только для админа)
    if action == "close_chat":
        if not user["is_admin"]:
            cur.close()
            conn.close()
            return err("Нет доступа", 403)
        chat_id = body.get("chat_id")
        cur.execute("UPDATE support_chats SET status = 'closed' WHERE id = %s", (chat_id,))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"success": True})

    cur.close()
    conn.close()
    return err("Неизвестное действие")
