import React, { useEffect, useState } from "react";

const API_URL = "/api/v1/notifications";  // 🔹 Use relative URL (works in Docker)
const EVENTS_URL = "/events/";  // 🔹 Use relative URL for WebSockets/SSE

function App() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // 🔹 Debugging: Log API Response
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        console.log("📩 Fetched Notifications:", data);
        setNotifications(data.notifications || []);
      })
      .catch(error => console.error("❌ API Fetch Error:", error));

    // Subscribe to SSE updates
    const eventSource = new EventSource(EVENTS_URL);
    eventSource.onmessage = (event) => {
      console.log("🔄 Received SSE Event:", event.data);
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [...prev, newNotification]);
    };

    return () => eventSource.close();
  }, []);

  return (
    <div>
      <h1>Notification Dashboard</h1>
      
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="queued">Queued</option>
        <option value="sent">Sent</option>
        <option value="failed">Failed</option>
      </select>

      <ul>
        {notifications
          .filter((n) => filter === "all" || n.status === filter)
          .map((n) => (
            <li key={n.id}>
              <strong>{n.type}</strong> to {n.recipient} - <em>{n.status}</em>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default App;
