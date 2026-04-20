"""
Ежедневная рулетка бонусов: пользователь крутит рулетку раз в день и получает от 1 до 10 рублей.
Действия: spin | status
"""
import json
import os
import random
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
        "SELECT u.id, u.name, u.balance FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "balance": float(row[2])}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    token = event.get("headers", {}).get("X-Session-Token", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    action = body.get("action") or event.get("queryStringParameters", {}).get("action", "status")

    conn = get_conn()
    cur = conn.cursor()

    user = get_user_by_token(cur, token)
    if not user:
        cur.close()
        conn.close()
        return err("Не авторизован", 401)

    # Проверить статус — крутил ли сегодня
    cur.execute(
        "SELECT amount, claimed_at FROM daily_roulette WHERE user_id = %s AND claimed_at = CURRENT_DATE",
        (user["id"],)
    )
    today_record = cur.fetchone()

    if action == "status":
        cur.close()
        conn.close()
        return ok({
            "can_spin": today_record is None,
            "today_amount": float(today_record[0]) if today_record else None,
        })

    if action == "spin":
        if today_record:
            cur.close()
            conn.close()
            return err("Вы уже крутили рулетку сегодня")

        # Случайная сумма от 1 до 10 рублей (с копейками)
        amount = round(random.uniform(1.0, 10.0), 2)

        # Записываем выигрыш
        cur.execute(
            "INSERT INTO daily_roulette (user_id, amount) VALUES (%s, %s)",
            (user["id"], amount)
        )
        # Начисляем на баланс
        cur.execute(
            "UPDATE users SET balance = balance + %s WHERE id = %s RETURNING balance",
            (amount, user["id"])
        )
        new_balance = float(cur.fetchone()[0])
        conn.commit()
        cur.close()
        conn.close()

        return ok({"amount": amount, "new_balance": new_balance})

    cur.close()
    conn.close()
    return err("Неизвестное действие")
