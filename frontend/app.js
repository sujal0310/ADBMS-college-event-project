// Initial in-memory demo dataset used automatically when the backend API is offline.
function buildInitialDemoStore() {
  return {
    clubs: [
      {
        _id: "CLUB-CODE",
        name: "Coding Club",
        category: "Technical",
        department: "Computer Science",
        lead: { name: "Aarav Sharma", studentId: "STU7101", email: "aarav@college.edu" },
        members: [
          { studentId: "STU7101", name: "Aarav Sharma", department: "Computer Science", year: 4, role: "President" },
          { studentId: "STU8821", name: "Priya Verma", department: "Computer Science", year: 3, role: "Core" }
        ]
      },
      {
        _id: "CLUB-MUSIC",
        name: "Music Society",
        category: "Cultural",
        department: "Fine Arts",
        lead: { name: "Riya Sen", studentId: "STU6204", email: "riya@college.edu" },
        members: [
          { studentId: "STU6204", name: "Riya Sen", department: "Fine Arts", year: 3, role: "President" },
          { studentId: "STU8821", name: "Priya Verma", department: "Computer Science", year: 3, role: "Member" }
        ]
      },
      {
        _id: "CLUB-ROBO",
        name: "Robotics Club",
        category: "Technical",
        department: "Electrical Engineering",
        lead: { name: "Karan Patel", studentId: "STU5309", email: "karan@college.edu" },
        members: [
          { studentId: "STU5309", name: "Karan Patel", department: "Electrical Engineering", year: 4, role: "President" },
          { studentId: "STU4412", name: "Rohan Gupta", department: "Electrical Engineering", year: 2, role: "Member" }
        ]
      }
    ],
    events: [
      {
        _id: "EVT101",
        title: "HackCampus 2026",
        category: "Technical",
        organizerClub: "Coding Club",
        venue: "Auditorium A",
        date: "2026-10-15T09:00:00Z",
        capacity: 200,
        seatsAvailable: 45,
        entryFee: 150,
        tags: ["hackathon", "coding", "prizes"],
        sponsors: ["TechCorp", "DevStudio"]
      },
      {
        _id: "EVT102",
        title: "Annual Music Night",
        category: "Cultural",
        organizerClub: "Music Society",
        venue: "Open Air Theatre",
        date: "2026-10-20T18:00:00Z",
        capacity: 500,
        seatsAvailable: 120,
        entryFee: 0,
        tags: ["music", "concert", "night"],
        sponsors: []
      },
      {
        _id: "EVT103",
        title: "AI & Robotics Workshop",
        category: "Technical",
        organizerClub: "Robotics Club",
        venue: "Lab 3",
        date: "2026-11-05T10:00:00Z",
        capacity: 60,
        seatsAvailable: 10,
        entryFee: 50,
        tags: ["ai", "robotics", "workshop"],
        sponsors: ["RoboLabs"]
      }
    ],
    registrations: [
      {
        ticketId: "TICK-2026-001",
        eventId: "EVT101",
        studentId: "STU8821",
        studentName: "Priya Verma",
        department: "Computer Science",
        year: 3,
        checkInStatus: false,
        paymentDetails: { method: "UPI", amountPaid: 150, status: "Completed" }
      },
      {
        ticketId: "TICK-2026-002",
        eventId: "EVT102",
        studentId: "STU8821",
        studentName: "Priya Verma",
        department: "Computer Science",
        year: 3,
        checkInStatus: true,
        paymentDetails: { method: "Free", amountPaid: 0, status: "Completed" }
      },
      {
        ticketId: "TICK-2026-003",
        eventId: "EVT101",
        studentId: "STU4412",
        studentName: "Rohan Gupta",
        department: "Electrical Engineering",
        year: 2,
        checkInStatus: true,
        paymentDetails: { method: "Card", amountPaid: 150, status: "Completed" }
      },
      {
        ticketId: "TICK-2026-004",
        eventId: "EVT103",
        studentId: "STU9903",
        studentName: "Ananya Roy",
        department: "Computer Science",
        year: 4,
        checkInStatus: false,
        paymentDetails: { method: "UPI", amountPaid: 50, status: "Completed" }
      }
    ]
  };
}

let demoStore = buildInitialDemoStore();
let useLiveApi = false;
let currentEventQuery = {};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    el.style.display = "none";
  }, 3200);
}

async function checkBackend() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      useLiveApi = true;
      document.getElementById("modePill").textContent = "Live MongoDB API";
      return;
    }
  } catch (_) {
    // Expected when opened directly via file:// or without backend running
  }
  useLiveApi = false;
  document.getElementById("modePill").textContent = "Standalone Demo Mode";
}

async function fetchEvents(params = {}) {
  currentEventQuery = params;
  if (useLiveApi) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`/api/events${qs ? "?" + qs : ""}`);
    return res.json();
  }
  return demoStore.events.filter((e) => {
    if (params.free === "true" && e.entryFee !== 0) return false;
    if (params.minSeats !== undefined && e.seatsAvailable <= Number(params.minSeats)) return false;
    if (params.tags) {
      const wanted = params.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (wanted.length > 0 && !e.tags.some((t) => wanted.includes(t.toLowerCase()))) return false;
    }
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      const hay = `${e.title} ${e.venue} ${e.organizerClub}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

async function renderEvents(params = currentEventQuery) {
  const events = await fetchEvents(params);
  const grid = document.getElementById("eventsGrid");
  if (!events.length) {
    grid.innerHTML = `<div class="card"><div class="meta">No events match the selected filter.</div></div>`;
    return;
  }

  grid.innerHTML = events
    .map((ev) => {
      const pct = Math.max(0, Math.min(100, (ev.seatsAvailable / ev.capacity) * 100));
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <h3>${escapeHtml(ev.title)}</h3>
              <div class="meta">${escapeHtml(ev._id)} · ${escapeHtml(ev.organizerClub)} · ${escapeHtml(ev.venue)}</div>
            </div>
            <span class="badge ${ev.entryFee === 0 ? "free" : ""}">
              ${ev.entryFee === 0 ? "FREE" : "₹" + escapeHtml(ev.entryFee)}
            </span>
          </div>
          <div class="meta">Seats Available: <strong>${escapeHtml(ev.seatsAvailable)}</strong> / ${escapeHtml(ev.capacity)}</div>
          <div class="seats-bar"><div class="seats-fill" style="width:${pct}%"></div></div>
          <div class="tags">${(ev.tags || []).map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}</div>
          <div class="meta">Sponsors: ${ev.sponsors && ev.sponsors.length ? ev.sponsors.map(escapeHtml).join(", ") : "None yet"}</div>
          <div class="card-actions">
            <button class="btn" data-action="book" data-event-id="${escapeHtml(ev._id)}" data-event-title="${escapeHtml(ev.title)}">Book Seat</button>
            <button class="btn btn-secondary" data-action="sponsor" data-event-id="${escapeHtml(ev._id)}">+ Sponsor</button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function renderRegistrations() {
  const dept = document.getElementById("deptFilter").value;
  let regs;
  if (useLiveApi) {
    const qs = dept ? `?department=${encodeURIComponent(dept)}` : "";
    regs = await (await fetch(`/api/registrations${qs}`)).json();
  } else {
    regs = demoStore.registrations.filter((r) => !dept || r.department === dept);
  }

  const tbody = document.getElementById("registrationsTable");
  if (!regs.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="meta">No registrations found.</td></tr>`;
    return;
  }

  tbody.innerHTML = regs
    .map(
      (r) => `
      <tr>
        <td><strong>${escapeHtml(r.ticketId)}</strong></td>
        <td>${escapeHtml(r.eventId)}</td>
        <td>${escapeHtml(r.studentName)} (${escapeHtml(r.studentId)})</td>
        <td>${escapeHtml(r.department)} (Yr ${escapeHtml(r.year)})</td>
        <td>${escapeHtml(r.paymentDetails.method)} · ₹${escapeHtml(r.paymentDetails.amountPaid)}</td>
        <td class="${r.checkInStatus ? "status-ok" : "status-pending"}">
          ${r.checkInStatus ? "Checked In" : "Pending"}
        </td>
        <td>
          ${
            r.checkInStatus
              ? "—"
              : `<div class="row-actions">
                  <button class="btn btn-success btn-sm" data-action="checkin" data-ticket-id="${escapeHtml(r.ticketId)}">Check In</button>
                  <button class="btn btn-danger btn-sm" data-action="cancel-ticket" data-ticket-id="${escapeHtml(r.ticketId)}">Cancel</button>
                </div>`
          }
        </td>
      </tr>
    `
    )
    .join("");
}

async function renderClubs() {
  const clubs = useLiveApi ? await (await fetch("/api/clubs")).json() : demoStore.clubs;

  document.getElementById("clubsGrid").innerHTML = clubs
    .map(
      (c) => `
      <div class="card">
        <div class="card-header">
          <h3>${escapeHtml(c.name)}</h3>
          <span class="badge">${escapeHtml(c.category)}</span>
        </div>
        <div class="meta">${escapeHtml(c.department)} · Lead: ${escapeHtml(c.lead.name)}</div>
        <div class="meta">Members (${escapeHtml(c.members.length)}): ${c.members.map((m) => escapeHtml(m.name)).join(", ")}</div>
        <div class="card-actions">
          <button class="btn btn-secondary" data-action="add-member" data-club-id="${escapeHtml(c._id)}" data-club-name="${escapeHtml(c.name)}">+ Add Member</button>
        </div>
      </div>
    `
    )
    .join("");
}

async function renderAnalytics() {
  let data;
  if (useLiveApi) {
    data = await (await fetch("/api/analytics")).json();
  } else {
    const revMap = {};
    const deptMap = {};
    const turnoutMap = {};

    for (const r of demoStore.registrations) {
      const ev = demoStore.events.find((e) => e._id === r.eventId) || { title: r.eventId, organizerClub: "-" };
      if (!revMap[r.eventId]) {
        revMap[r.eventId] = {
          eventId: r.eventId,
          eventTitle: ev.title,
          organizerClub: ev.organizerClub,
          totalRevenue: 0,
          totalTicketsSold: 0
        };
      }
      revMap[r.eventId].totalRevenue += r.paymentDetails.amountPaid;
      revMap[r.eventId].totalTicketsSold += 1;

      deptMap[r.department] = (deptMap[r.department] || 0) + 1;

      if (!turnoutMap[r.eventId]) {
        turnoutMap[r.eventId] = {
          eventId: r.eventId,
          eventTitle: ev.title,
          totalRegistrations: 0,
          checkedInCount: 0
        };
      }
      turnoutMap[r.eventId].totalRegistrations += 1;
      if (r.checkInStatus) turnoutMap[r.eventId].checkedInCount += 1;
    }

    data = {
      revenueByEvent: Object.values(revMap).sort((a, b) => b.totalRevenue - a.totalRevenue),
      departmentParticipation: Object.entries(deptMap)
        .map(([department, totalRegistrations]) => ({ department, totalRegistrations }))
        .sort((a, b) => b.totalRegistrations - a.totalRegistrations),
      turnoutRates: Object.values(turnoutMap).map((t) => ({
        ...t,
        turnoutPercentage: Number(((t.checkedInCount / t.totalRegistrations) * 100).toFixed(2))
      }))
    };
  }

  document.getElementById("revenueTable").innerHTML = data.revenueByEvent
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.eventTitle)}</td><td>${escapeHtml(r.organizerClub)}</td><td>${escapeHtml(r.totalTicketsSold)}</td><td>₹${escapeHtml(r.totalRevenue)}</td></tr>`
    )
    .join("");

  document.getElementById("deptTable").innerHTML = data.departmentParticipation
    .map((d) => `<tr><td>${escapeHtml(d.department)}</td><td>${escapeHtml(d.totalRegistrations)}</td></tr>`)
    .join("");

  document.getElementById("turnoutTable").innerHTML = data.turnoutRates
    .map(
      (t) =>
        `<tr><td>${escapeHtml(t.eventTitle ? `${t.eventTitle} (${t.eventId})` : t.eventId)}</td><td>${escapeHtml(t.checkedInCount)}</td><td>${escapeHtml(t.totalRegistrations)}</td><td>${escapeHtml(t.turnoutPercentage)}%</td></tr>`
    )
    .join("");
}

async function refreshAll() {
  await Promise.all([renderEvents(), renderRegistrations(), renderClubs(), renderAnalytics()]);
}

function openBookingDialog(eventId, title) {
  document.getElementById("bookEventId").value = eventId;
  document.getElementById("bookEventTitle").textContent = title;
  document.getElementById("bookingDialog").showModal();
}

function openAddMemberDialog(clubId, name) {
  document.getElementById("memberClubId").value = clubId;
  document.getElementById("memberClubName").textContent = name;
  document.getElementById("addMemberDialog").showModal();
}

async function addSponsor(eventId) {
  const sponsor = prompt("Enter sponsor name (e.g. CloudInc):");
  if (!sponsor || !sponsor.trim()) return;
  if (useLiveApi) {
    const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/sponsors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsor: sponsor.trim() })
    });
    const body = await res.json();
    if (!res.ok) return showToast(body.error || "Failed to add sponsor");
  } else {
    const ev = demoStore.events.find((e) => e._id === eventId);
    if (ev && !ev.sponsors.includes(sponsor.trim())) ev.sponsors.push(sponsor.trim());
  }
  showToast(`Added sponsor "${sponsor.trim()}" via $addToSet`);
  renderEvents();
}

async function checkInTicket(ticketId) {
  if (useLiveApi) {
    const res = await fetch(`/api/registrations/${encodeURIComponent(ticketId)}/check-in`, { method: "PATCH" });
    const body = await res.json();
    if (!res.ok) return showToast(body.error || "Check-in failed");
  } else {
    const reg = demoStore.registrations.find((r) => r.ticketId === ticketId);
    if (!reg) return showToast("Ticket not found");
    if (reg.checkInStatus) return showToast("Already checked in");
    reg.checkInStatus = true;
  }
  showToast(`Checked in ${ticketId}`);
  await Promise.all([renderRegistrations(), renderAnalytics()]);
}

async function cancelTicket(ticketId) {
  if (useLiveApi) {
    const res = await fetch(`/api/registrations/${encodeURIComponent(ticketId)}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) return showToast(body.error || "Cancellation failed");
  } else {
    const idx = demoStore.registrations.findIndex((r) => r.ticketId === ticketId && !r.checkInStatus);
    if (idx === -1) return showToast("Cannot cancel ticket");
    const [removed] = demoStore.registrations.splice(idx, 1);
    const ev = demoStore.events.find((e) => e._id === removed.eventId);
    if (ev) ev.seatsAvailable += 1;
  }
  showToast(`Cancelled ${ticketId} (seat restored)`);
  await Promise.all([renderEvents(), renderRegistrations(), renderAnalytics()]);
}

// Event delegation for dynamic action buttons
document.getElementById("eventsGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "book") {
    openBookingDialog(btn.dataset.eventId, btn.dataset.eventTitle);
  } else if (btn.dataset.action === "sponsor") {
    addSponsor(btn.dataset.eventId);
  }
});

document.getElementById("registrationsTable").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "checkin") {
    checkInTicket(btn.dataset.ticketId);
  } else if (btn.dataset.action === "cancel-ticket") {
    cancelTicket(btn.dataset.ticketId);
  }
});

document.getElementById("clubsGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='add-member']");
  if (!btn) return;
  openAddMemberDialog(btn.dataset.clubId, btn.dataset.clubName);
});

// Dialog close buttons
document.getElementById("cancelBookBtn").addEventListener("click", () => {
  document.getElementById("bookingDialog").close();
});
document.getElementById("cancelCreateEventBtn").addEventListener("click", () => {
  document.getElementById("createEventDialog").close();
});
document.getElementById("cancelAddMemberBtn").addEventListener("click", () => {
  document.getElementById("addMemberDialog").close();
});

// Open Create Event Dialog
document.getElementById("openCreateEventBtn").addEventListener("click", () => {
  document.getElementById("newEventDate").value = "2026-11-20T10:00";
  document.getElementById("createEventDialog").showModal();
});

// Form submissions
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    eventId: document.getElementById("bookEventId").value,
    studentId: document.getElementById("bookStudentId").value.trim(),
    studentName: document.getElementById("bookStudentName").value.trim(),
    department: document.getElementById("bookDepartment").value,
    year: Number(document.getElementById("bookYear").value),
    paymentMethod: document.getElementById("bookMethod").value
  };

  if (useLiveApi) {
    const res = await fetch("/api/registrations/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    if (!res.ok) return showToast(body.error || "Booking failed");
    showToast(`Booked ${body.ticket.ticketId}`);
  } else {
    const ev = demoStore.events.find((item) => item._id === payload.eventId);
    if (!ev || ev.seatsAvailable <= 0) return showToast("Sold out");
    if (demoStore.registrations.some((r) => r.eventId === payload.eventId && r.studentId === payload.studentId)) {
      return showToast("Student already registered for this event");
    }
    ev.seatsAvailable -= 1;
    const ticketId = `TICK-2026-${String(demoStore.registrations.length + 1).padStart(3, "0")}`;
    demoStore.registrations.unshift({
      ticketId,
      ...payload,
      checkInStatus: false,
      paymentDetails: {
        method: ev.entryFee === 0 ? "Free" : payload.paymentMethod,
        amountPaid: ev.entryFee,
        status: "Completed"
      }
    });
    showToast(`Booked ${ticketId} (seat decremented atomically)`);
  }

  document.getElementById("bookingDialog").close();
  e.target.reset();
  await Promise.all([renderEvents(), renderRegistrations(), renderAnalytics()]);
});

document.getElementById("createEventForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const capacity = Number(document.getElementById("newEventCapacity").value);
  const tags = document
    .getElementById("newEventTags")
    .value.split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const payload = {
    _id: document.getElementById("newEventId").value.trim(),
    title: document.getElementById("newEventTitle").value.trim(),
    category: document.getElementById("newEventCategory").value,
    organizerClub: document.getElementById("newEventClub").value.trim(),
    venue: document.getElementById("newEventVenue").value.trim(),
    date: new Date(document.getElementById("newEventDate").value).toISOString(),
    capacity,
    seatsAvailable: capacity,
    entryFee: Number(document.getElementById("newEventFee").value),
    tags,
    coordinators: [
      {
        name: document.getElementById("newEventCoordName").value.trim(),
        contact: document.getElementById("newEventCoordEmail").value.trim()
      }
    ],
    sponsors: []
  };

  if (useLiveApi) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    if (!res.ok) return showToast(body.error || "Failed to create event");
  } else {
    if (demoStore.events.some((ev) => ev._id === payload._id)) {
      return showToast(`Event "${payload._id}" already exists`);
    }
    demoStore.events.push(payload);
  }

  showToast(`Created event ${payload._id}`);
  document.getElementById("createEventDialog").close();
  e.target.reset();
  await renderEvents();
});

document.getElementById("addMemberForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const clubId = document.getElementById("memberClubId").value;
  const payload = {
    studentId: document.getElementById("memberStudentId").value.trim(),
    name: document.getElementById("memberName").value.trim(),
    department: document.getElementById("memberDepartment").value,
    year: Number(document.getElementById("memberYear").value),
    role: document.getElementById("memberRole").value
  };

  if (useLiveApi) {
    const res = await fetch(`/api/clubs/${encodeURIComponent(clubId)}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    if (!res.ok) return showToast(body.error || "Failed to add member");
  } else {
    const club = demoStore.clubs.find((c) => c._id === clubId);
    if (!club) return showToast("Club not found");
    if (club.members.some((m) => m.studentId === payload.studentId)) {
      return showToast(`Student "${payload.studentId}" is already a member`);
    }
    club.members.push(payload);
  }

  showToast(`Added ${payload.name} to ${clubId}`);
  document.getElementById("addMemberDialog").close();
  e.target.reset();
  await renderClubs();
});

// Reset Seed Data
document.getElementById("resetSeedBtn").addEventListener("click", async () => {
  if (useLiveApi) {
    const res = await fetch("/api/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ifEmptyOnly: false })
    });
    const body = await res.json();
    if (!res.ok) return showToast(body.error || "Seed reset failed");
  } else {
    demoStore = buildInitialDemoStore();
  }
  showToast("Reset dataset to initial seed");
  await refreshAll();
});

// Tabs & Filters
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab === "analytics") renderAnalytics();
  });
});

document.getElementById("filterAllBtn").addEventListener("click", () => renderEvents({}));
document.getElementById("filterFreeBtn").addEventListener("click", () => renderEvents({ free: "true", minSeats: "50" }));
document.getElementById("filterCodingBtn").addEventListener("click", () => renderEvents({ tags: "coding,hackathon" }));
document.getElementById("tagSearchBtn").addEventListener("click", () => {
  const tags = document.getElementById("tagSearchInput").value.trim();
  const search = document.getElementById("eventSearchInput").value.trim();
  const params = {};
  if (tags) params.tags = tags;
  if (search) params.search = search;
  renderEvents(params);
});
document.getElementById("deptFilter").addEventListener("change", renderRegistrations);
document.getElementById("quickCheckInBtn").addEventListener("click", () => {
  const id = document.getElementById("ticketCheckInInput").value.trim();
  if (id) checkInTicket(id);
});

(async function init() {
  await checkBackend();
  await refreshAll();
})();
