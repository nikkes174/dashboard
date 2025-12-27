import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import LaserFlow from "../components/LaserFlow";
import ElectricBorder from "../components/ElectricBorder";
import NeonButton from "../components/NeonButton";

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:8000/auth/login_json", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({username, password}),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Роль:", data.role);

                switch (data.role) {
                    case "vpn":
                        navigate("/users");
                        break;

                    case "codex":
                        navigate("/codex");
                        break;

                    case "admin":
                        navigate("/admin");
                        break;

                    default:
                        navigate("/"); // fallback
                }
            
            } else {
                setError(data.detail || "❌ Неверный логин или пароль");
            }
        } catch
            (err) {
            console.error("Ошибка соединения:", err);
            setError("Сервер недоступен");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                height: "100vh",
                width: "100vw",
                backgroundColor: "#060010",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* 🔥 Лазерный фон */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <LaserFlow color="#FF79C6" horizontalBeamOffset={0} verticalBeamOffset={-0.17}/>
            </div>

            {/* ⚡ Электрическая рамка */}
            <ElectricBorder
                color="#FF79C6"
                speed={1.3}
                chaos={0.7}
                thickness={2}
                style={{
                    padding: "40px",
                    width: "400px",
                    borderRadius: "20px",
                    background: "rgba(20, 0, 30, 0.85)",
                    boxShadow: "0 0 40px rgba(255, 121, 198, 0.4)",
                    zIndex: 5,
                }}
            >
                <h2 style={{color: "white", textAlign: "center", marginBottom: "20px"}}>
                    Вход в DashboardVPN
                </h2>

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Логин"
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        borderRadius: "6px",
                        border: "1px solid #FF79C6",
                        background: "transparent",
                        color: "white",
                    }}
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "20px",
                        borderRadius: "6px",
                        border: "1px solid #FF79C6",
                        background: "transparent",
                        color: "white",
                    }}
                />

                {error && (
                    <p style={{color: "#FF79C6", textAlign: "center", marginBottom: "10px"}}>{error}</p>
                )}

                <NeonButton
                    onClick={handleLogin}
                    disabled={loading}
                    style={{width: "100%", padding: "10px", fontSize: "16px"}}
                >
                    {loading ? "Входим..." : "Войти"}
                </NeonButton>
            </ElectricBorder>
        </div>
    );
}
