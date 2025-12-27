import React, { useEffect, useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";

import "../components/Codex.css";

export default function Codex() {
    const columnHelper = createColumnHelper();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/codex/users", {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => console.error("Ошибка загрузки:", err));
    }, []);

    function deleteFromDB(id) {
        fetch(`http://127.0.0.1:8000/codex/delete/${id}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then((res) => res.json())
            .then(() => {
                setData((prev) => prev.filter((u) => u.id !== id));
            });
    }

    function deleteFromChannel(id) {
        fetch(`http://127.0.0.1:8000/codex/remove_channel/${id}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then((res) => res.json())
            .then(() => {
                console.log("Удалено с канала");
            });
    }

    const columns = [
        columnHelper.accessor("id", { header: "ID" }),
        columnHelper.accessor("name", { header: "Имя подписчика" }),
        columnHelper.accessor("end_date", { header: "Дата окончания" }),
        columnHelper.display({
            id: "actions",
            header: "Действия",
            cell: ({ row }) => (
                <div className="btn-group">
                    <button
                        className="delete-btn"
                        onClick={() => deleteFromDB(row.original.id)}
                    >
                        Удалить из БД
                    </button>

                    <button
                        className="channel-btn"
                        onClick={() => deleteFromChannel(row.original.id)}
                    >
                        Удалить с канала
                    </button>
                </div>
            ),
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (loading) return <h2 style={{ color: "white" }}>Загрузка...</h2>;

    return (
        <div className="codex-wrapper">
            <div className="codex-card">
                <h1>Codex подписчики</h1>

                <table className="codex-table">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
