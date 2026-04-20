"""
Авторизация пользователей: регистрация, вход, профиль, выход, история.
Поддерживает email и телефон + пароль.
Параметр action: register | login | me | logout | balance | game | history
"""
import json
import os
import hashlib
import secrets
import psycopg2


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": data}


def err(msg: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": CORS_HEADERS, "body": {"error": msg}}


def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.email, u.phone, u.name, u.avatar_url, u.balance, u.is_admin "
        "FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "phone": row[2], "name": row[3], "avatar_url": row[4], "balance": float(row[5]), "is_admin": bool(row[6])}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    params = event.get("queryStringParameters") or {}
    action = body.get("action") or params.get("action", "")
    token = (event.get("headers") or {}).get("X-Session-Token", "")

    conn = get_conn()
    try:
        # --- REGISTER ---
        if action == "register":
            email = body.get("email", "").strip().lower()
            phone = body.get("phone", "").strip()
            password = body.get("password", "")
            name = body.get("name", "").strip()

            if not password or len(password) < 6:
                return err("Пароль минимум 6 символов")
            if not email and not phone:
                return err("Укажите email или телефон")

            pw_hash = hash_password(password)
            cur = conn.cursor()

            if email:
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    cur.close()
                    return err("Email уже зарегистрирован", 409)
            if phone:
                cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
                if cur.fetchone():
                    cur.close()
                    return err("Телефон уже зарегистрирован", 409)

            display_name = name or (email.split("@")[0] if email else phone)
            cur.execute(
                "INSERT INTO users (email, phone, password_hash, name, balance) VALUES (%s, %s, %s, %s, 0) RETURNING id",
                (email or None, phone or None, pw_hash, display_name)
            )
            user_id = cur.fetchone()[0]
            token_val = make_token()
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, token_val))
            conn.commit()
            cur.close()

            return ok({"token": token_val, "user": {"id": user_id, "email": email, "phone": phone, "name": display_name, "balance": 0.0}})

        # --- LOGIN ---
        if action == "login":
            email = body.get("email", "").strip().lower()
            phone = body.get("phone", "").strip()
            password = body.get("password", "")

            if not password:
                return err("Введите пароль")
            if not email and not phone:
                return err("Укажите email или телефон")

            pw_hash = hash_password(password)
            cur = conn.cursor()

            if email:
                cur.execute(
                    "SELECT id, email, phone, name, avatar_url, balance, is_admin FROM users WHERE email = %s AND password_hash = %s",
                    (email, pw_hash)
                )
            else:
                cur.execute(
                    "SELECT id, email, phone, name, avatar_url, balance, is_admin FROM users WHERE phone = %s AND password_hash = %s",
                    (phone, pw_hash)
                )

            row = cur.fetchone()
            if not row:
                cur.close()
                return err("Неверный логин или пароль", 401)

            user = {"id": row[0], "email": row[1], "phone": row[2], "name": row[3], "avatar_url": row[4], "balance": float(row[5]), "is_admin": bool(row[6])}
            token_val = make_token()
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user["id"], token_val))
            conn.commit()
            cur.close()
            return ok({"token": token_val, "user": user})

        # --- ME ---
        if action == "me":
            user = get_user_by_token(conn, token)
            if not user:
                return err("Не авторизован", 401)
            return ok({"user": user})

        # --- LOGOUT ---
        if action == "logout":
            if token:
                cur = conn.cursor()
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
                cur.close()
            return ok({"ok": True})

        # --- BALANCE ---
        if action == "balance":
            user = get_user_by_token(conn, token)
            if not user:
                return err("Не авторизован", 401)
            new_balance = body.get("balance")
            if new_balance is None:
                return err("Укажите balance")
            cur = conn.cursor()
            cur.execute("UPDATE users SET balance = %s, updated_at = NOW() WHERE id = %s", (new_balance, user["id"]))
            conn.commit()
            cur.close()
            return ok({"ok": True, "balance": float(new_balance)})

        # --- SAVE GAME ---
        if action == "game":
            user = get_user_by_token(conn, token)
            if not user:
                return err("Не авторизован", 401)
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO game_history (user_id, game_name, bet, result, multiplier) VALUES (%s, %s, %s, %s, %s)",
                (user["id"], body.get("game_name", ""), body.get("bet", 0), body.get("result", 0), body.get("multiplier"))
            )
            conn.commit()
            cur.close()
            return ok({"ok": True})

        # --- HISTORY ---
        if action == "history":
            user = get_user_by_token(conn, token)
            if not user:
                return err("Не авторизован", 401)
            cur = conn.cursor()
            cur.execute(
                "SELECT game_name, bet, result, multiplier, created_at FROM game_history WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
                (user["id"],)
            )
            rows = cur.fetchall()
            cur.close()
            history = [
                {"game_name": r[0], "bet": float(r[1]), "result": float(r[2]),
                 "multiplier": float(r[3]) if r[3] else None, "created_at": r[4].isoformat()}
                for r in rows
            ]
            return ok({"history": history})

        return err("Неизвестный action", 404)

    finally:
        conn.close()