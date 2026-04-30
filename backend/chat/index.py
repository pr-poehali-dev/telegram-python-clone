import json
import os
import psycopg2

SCHEMA = "t_p65733450_telegram_python_clon"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user(token, conn):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT u.id, u.name, u.is_admin FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()",
            (token,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {"id": row[0], "name": row[1] or f"Игрок#{row[0]}", "is_admin": row[2]}


def handler(event: dict, context) -> dict:
    """Общий чат: отправка, получение, удаление сообщений, бан пользователей"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    token = event.get("headers", {}).get("x-session-token") or event.get("headers", {}).get("X-Session-Token", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    action = body.get("action") or (event.get("queryStringParameters") or {}).get("action", "get_messages")

    conn = get_conn()
    try:
        user = get_user(token, conn) if token else None

        if action == "get_messages":
            limit = int((event.get("queryStringParameters") or {}).get("limit", 50))
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT m.id, m.text, m.created_at, u.id as uid, u.name, u.is_admin
                        FROM {SCHEMA}.chat_messages m
                        JOIN {SCHEMA}.users u ON u.id = m.user_id
                        WHERE m.is_removed = FALSE
                        ORDER BY m.created_at DESC
                        LIMIT %s""",
                    (limit,),
                )
                rows = cur.fetchall()
            messages = [
                {
                    "id": r[0],
                    "text": r[1],
                    "created_at": r[2].isoformat(),
                    "user_id": r[3],
                    "user_name": r[4] or f"Игрок#{r[3]}",
                    "is_admin": r[5],
                }
                for r in reversed(rows)
            ]
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"messages": messages})}

        if action == "send_message":
            if not user:
                return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Не авторизован"})}
            text = body.get("text", "").strip()
            if not text or len(text) > 500:
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Текст от 1 до 500 символов"})}

            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.chat_bans WHERE user_id = %s",
                    (user["id"],),
                )
                if cur.fetchone():
                    return {"statusCode": 403, "headers": cors, "body": json.dumps({"error": "Вы заблокированы в чате"})}

                cur.execute(
                    f"INSERT INTO {SCHEMA}.chat_messages (user_id, text) VALUES (%s, %s) RETURNING id, created_at",
                    (user["id"], text),
                )
                msg_id, created_at = cur.fetchone()
                conn.commit()

            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({
                    "message": {
                        "id": msg_id,
                        "text": text,
                        "created_at": created_at.isoformat(),
                        "user_id": user["id"],
                        "user_name": user["name"],
                        "is_admin": user["is_admin"],
                    }
                }),
            }

        if action == "remove_message":
            if not user or not user["is_admin"]:
                return {"statusCode": 403, "headers": cors, "body": json.dumps({"error": "Нет доступа"})}
            msg_id = body.get("message_id")
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.chat_messages SET is_removed = TRUE WHERE id = %s",
                    (msg_id,),
                )
                conn.commit()
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

        if action == "ban_user":
            if not user or not user["is_admin"]:
                return {"statusCode": 403, "headers": cors, "body": json.dumps({"error": "Нет доступа"})}
            target_id = body.get("user_id")
            reason = body.get("reason", "")
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.chat_bans (user_id, banned_by, reason) VALUES (%s, %s, %s) ON CONFLICT (user_id) DO NOTHING",
                    (target_id, user["id"], reason),
                )
                conn.commit()
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

        if action == "unban_user":
            if not user or not user["is_admin"]:
                return {"statusCode": 403, "headers": cors, "body": json.dumps({"error": "Нет доступа"})}
            target_id = body.get("user_id")
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.chat_bans SET reason = 'unbanned' WHERE user_id = %s",
                    (target_id,),
                )
                conn.commit()
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Неизвестное действие"})}

    finally:
        conn.close()
