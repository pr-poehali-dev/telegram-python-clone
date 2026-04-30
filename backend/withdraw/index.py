import json
import os
import psycopg2

SCHEMA = "t_p65733450_telegram_python_clon"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user(token, conn):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT u.id, u.balance, u.is_admin FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()",
            (token,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {"id": row[0], "balance": float(row[1]), "is_admin": row[2]}


def handler(event: dict, context) -> dict:
    """Заявки на вывод через СБП: создать заявку, список заявок, изменить статус (для админа)"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = event.get("headers", {}).get("x-session-token") or event.get("headers", {}).get("X-Session-Token", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    action = body.get("action") or (event.get("queryStringParameters") or {}).get("action", "")

    conn = get_conn()
    try:
        user = get_user(token, conn) if token else None

        if action == "create":
            if not user:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
            amount = float(body.get("amount", 0))
            phone = body.get("phone", "").strip()
            bank = body.get("bank", "").strip()

            if amount < 100:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Минимальная сумма вывода — 100 ₽"})}
            if amount > user["balance"]:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Недостаточно средств"})}
            if not phone or not bank:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите телефон и банк"})}

            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s",
                    (amount, user["id"]),
                )
                cur.execute(
                    f"INSERT INTO {SCHEMA}.withdraw_requests (user_id, amount, phone, bank) VALUES (%s, %s, %s, %s) RETURNING id",
                    (user["id"], amount, phone, bank),
                )
                req_id = cur.fetchone()[0]
                conn.commit()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "request_id": req_id})}

        if action == "my_requests":
            if not user:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, amount, phone, bank, status, created_at FROM {SCHEMA}.withdraw_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
                    (user["id"],),
                )
                rows = cur.fetchall()
            requests = [
                {"id": r[0], "amount": float(r[1]), "phone": r[2], "bank": r[3], "status": r[4], "created_at": r[5].isoformat()}
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"requests": requests})}

        if action == "admin_list":
            if not user or not user["is_admin"]:
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT w.id, w.amount, w.phone, w.bank, w.status, w.created_at, u.name, u.email
                        FROM {SCHEMA}.withdraw_requests w
                        JOIN {SCHEMA}.users u ON u.id = w.user_id
                        ORDER BY w.created_at DESC
                        LIMIT 100""",
                )
                rows = cur.fetchall()
            requests = [
                {
                    "id": r[0], "amount": float(r[1]), "phone": r[2], "bank": r[3],
                    "status": r[4], "created_at": r[5].isoformat(),
                    "user_name": r[6] or "—", "user_email": r[7] or "—",
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"requests": requests})}

        if action == "update_status":
            if not user or not user["is_admin"]:
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
            req_id = body.get("request_id")
            status = body.get("status")
            if status not in ("pending", "done", "rejected"):
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный статус"})}

            with conn.cursor() as cur:
                if status == "rejected":
                    cur.execute(
                        f"SELECT user_id, amount FROM {SCHEMA}.withdraw_requests WHERE id = %s AND status = 'pending'",
                        (req_id,),
                    )
                    row = cur.fetchone()
                    if row:
                        cur.execute(
                            f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s",
                            (row[1], row[0]),
                        )
                cur.execute(
                    f"UPDATE {SCHEMA}.withdraw_requests SET status = %s, updated_at = NOW() WHERE id = %s",
                    (status, req_id),
                )
                conn.commit()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}

    finally:
        conn.close()
