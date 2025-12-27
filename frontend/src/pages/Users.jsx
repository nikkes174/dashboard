import React, {useEffect, useState, useMemo} from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import "./Users.css"; // ← стили здесь

export default function Users() {
    const columnHelper = createColumnHelper();

    const [data, setData] = useState([]);

    function deleteUser(id) {
        fetch(`http://127.0.0.1:8000/users/${id}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then((res) => res.json())
            .then(() => {
                setData(prev => prev.filter(u => u.user_id !== id));
            });
    }

    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);

    const [searchId, setSearchId] = useState("");

    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetch("http://127.0.0.1:8000/users/", {
            method: "GET",
            credentials: "include",
        })
            .then(async (res) => {
                if (res.status === 401) {
                    setAuthError(true);
                    return [];
                }
                return await res.json();
            })
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => console.error("Ошибка загрузки:", err));
    }, []);

    const filteredData = useMemo(() => {
        if (!searchId.trim()) return data;
        return data.filter((u) => String(u.user_id).includes(searchId.trim()));
    }, [data, searchId]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    const columns = [
        columnHelper.accessor("user_id", {header: "ID"}),
        columnHelper.accessor("username", {header: "Пользователь"}),
        columnHelper.accessor("end_date", {header: "Конец подписки"}),
        columnHelper.accessor("trial_end", {header: "Конец пробного периода"}),
        columnHelper.display({
            id: "actions",
            header: "Удалить",
            cell: ({row}) => (
                <button
                    onClick={() => deleteUser(row.original.user_id)}
                    className="delete-btn"
                >
                    ✖
                </button>
            ),
        }),
    ];

    const table = useReactTable({
        data: paginatedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (authError) {
        return (
            <div style={styles.errorPage}>
                <h1 style={{color: "red", fontSize: "28px"}}>🚫 Не авторизован</h1>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={styles.errorPage}>
                <h1 style={{color: "white", fontSize: "26px"}}>Загрузка...</h1>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>

                <div style={{marginBottom: "20px"}}>
                    <input
                        type="text"
                        placeholder="Поиск по ID..."
                        value={searchId}
                        onChange={(e) => {
                            setSearchId(e.target.value);
                            setPage(1);
                        }}
                        style={{
                            padding: "10px 15px",
                            width: "200px",
                            borderRadius: "8px",
                            border: "1px solid #FF79C6",
                            background: "rgba(255,255,255,0.1)",
                            color: "white",
                        }}
                    />
                </div>

                <table style={{borderCollapse: "collapse", width: "100%"}}>
                    <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} style={styles.th}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>

                    <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} style={styles.td}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div style={styles.pagination}>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        style={styles.pageBtn}
                    >
                        ⬅ Назад
                    </button>

                    <span style={{padding: "0 15px"}}>
                        Страница {page} / {totalPages}
                    </span>

                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        style={styles.pageBtn}
                    >
                        Вперёд ➡
                    </button>
                </div>

            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: "100vh",
        width: "100vw",
        background: "url('/vpn.jpg') center/cover no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px",
    },
    card: {
        background: "rgba(20,0,30,0.8)",
        borderRadius: "12px",
        padding: "20px 30px",
        boxShadow: "0 0 40px rgba(255,121,198,0.4)",
        color: "white",
    },
    th: {
        borderBottom: "2px solid #FF79C6",
        padding: "10px",
        textAlign: "left",
    },
    td: {
        padding: "10px",
        borderBottom: "1px solid #333",
    },
    pagination: {
        display: "flex",
        justifyContent: "center",
        marginTop: "20px",
        alignItems: "center",
        color: "white",
    },
    pageBtn: {
        padding: "8px 15px",
        borderRadius: "6px",
        background: "#FF79C6",
        border: "none",
        cursor: "pointer",
        color: "black",
        fontWeight: "bold",
    },
    errorPage: {
        minHeight: "100vh",
        width: "100vw",
        background: "url('/vpn.jpg') center/cover no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
};
