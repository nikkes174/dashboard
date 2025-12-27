import { useEffect, useState } from "react";

export default function VpnDashboard() {
  const [vpnList, setVpnList] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/vpn/list")
      .then(res => res.json())
      .then(data => setVpnList(data))
      .catch(err => console.error("Ошибка загрузки:", err));
  }, []);

  return (
    <div style={{ background: "#060010", color: "#fff", minHeight: "100vh", padding: "40px" }}>
      <h1 style={{ color: "#FF79C6", marginBottom: "20px" }}>VPN Dashboard</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#1a002b" }}>
            <th style={{ padding: "10px", border: "1px solid #FF79C6" }}>ID</th>
            <th style={{ padding: "10px", border: "1px solid #FF79C6" }}>Country</th>
            <th style={{ padding: "10px", border: "1px solid #FF79C6" }}>IP</th>
            <th style={{ padding: "10px", border: "1px solid #FF79C6" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {vpnList.map(vpn => (
            <tr key={vpn.id}>
              <td style={{ padding: "10px", border: "1px solid #FF79C6" }}>{vpn.id}</td>
              <td style={{ padding: "10px", border: "1px solid #FF79C6" }}>{vpn.country}</td>
              <td style={{ padding: "10px", border: "1px solid #FF79C6" }}>{vpn.ip}</td>
              <td style={{ padding: "10px", border: "1px solid #FF79C6", color: vpn.status === "active" ? "#00FFAA" : "#FF5555" }}>
                {vpn.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
