// ============================================================================
// Task 4: Analytics Pipeline (Aggregation Framework)
// Run: mongosh database/04_analytics_pipelines.js
// ============================================================================

const campusDb = db.getSiblingDB("campus_events");

// 4.1 Revenue per Event & Club
print("\n--- 4.1 Total Revenue Raised per Event & Club ---");
printjson(
  campusDb.registrations
    .aggregate([
      {
        $match: { "paymentDetails.status": "Completed" }
      },
      {
        $group: {
          _id: "$eventId",
          totalRevenue: { $sum: "$paymentDetails.amountPaid" },
          totalTicketsSold: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "eventInfo"
        }
      },
      { $unwind: "$eventInfo" },
      {
        $project: {
          _id: 0,
          eventId: "$_id",
          eventTitle: "$eventInfo.title",
          organizerClub: "$eventInfo.organizerClub",
          totalRevenue: 1,
          totalTicketsSold: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])
    .toArray()
);

// 4.2 Department Participation Metrics
print("\n--- 4.2 Department Participation (Highest Total Registrations) ---");
printjson(
  campusDb.registrations
    .aggregate([
      {
        $group: {
          _id: "$department",
          totalRegistrations: { $sum: 1 },
          checkedInCount: {
            $sum: { $cond: [{ $eq: ["$checkInStatus", true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          totalRegistrations: 1,
          checkedInCount: 1
        }
      },
      { $sort: { totalRegistrations: -1 } }
    ])
    .toArray()
);

// 4.3 Turnout Rate Calculation (Total Registrations vs Checked-In)
print("\n--- 4.3 Turnout Rate per Event ---");
printjson(
  campusDb.registrations
    .aggregate([
      {
        $group: {
          _id: "$eventId",
          totalRegistrations: { $sum: 1 },
          checkedInCount: {
            $sum: { $cond: [{ $eq: ["$checkInStatus", true] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "eventInfo"
        }
      },
      { $unwind: "$eventInfo" },
      {
        $project: {
          _id: 0,
          eventId: "$_id",
          eventTitle: "$eventInfo.title",
          totalRegistrations: 1,
          checkedInCount: 1,
          turnoutPercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$checkedInCount", "$totalRegistrations"] },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { turnoutPercentage: -1 } }
    ])
    .toArray()
);

// 4.4 Bonus: Club Membership Summary across Departments
print("\n--- 4.4 Club Membership Overview ---");
printjson(
  campusDb.clubs
    .aggregate([
      {
        $project: {
          _id: 0,
          clubId: "$_id",
          name: 1,
          category: 1,
          department: 1,
          memberCount: { $size: "$members" }
        }
      },
      { $sort: { memberCount: -1 } }
    ])
    .toArray()
);
