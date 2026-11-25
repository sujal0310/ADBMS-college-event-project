const { getDB } = require("../config/db");

/**
 * Task 4.1: Total revenue raised and tickets sold per event & organizing club.
 */
async function getRevenueByEvent(db = getDB()) {
  return db
    .collection("registrations")
    .aggregate([
      { $match: { "paymentDetails.status": "Completed" } },
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
    .toArray();
}

/**
 * Task 4.2: Department participation metrics ordered by highest registrations.
 */
async function getDepartmentParticipation(db = getDB()) {
  return db
    .collection("registrations")
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
    .toArray();
}

/**
 * Task 4.3: Turnout rate per event (checkedInCount / totalRegistrations * 100).
 */
async function getTurnoutRates(db = getDB()) {
  return db
    .collection("registrations")
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
      {
        $unwind: {
          path: "$eventInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          eventId: "$_id",
          eventTitle: { $ifNull: ["$eventInfo.title", "$_id"] },
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
    .toArray();
}

/**
 * Task 4.4: Club membership summary across departments.
 */
async function getClubMembershipOverview(db = getDB()) {
  return db
    .collection("clubs")
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
    .toArray();
}

/**
 * Combined analytics dashboard payload used by the frontend.
 */
async function getDashboardAnalytics() {
  const db = getDB();
  const [revenueByEvent, departmentParticipation, turnoutRates, clubOverview] = await Promise.all([
    getRevenueByEvent(db),
    getDepartmentParticipation(db),
    getTurnoutRates(db),
    getClubMembershipOverview(db)
  ]);

  return {
    revenueByEvent,
    departmentParticipation,
    turnoutRates,
    clubOverview
  };
}

module.exports = {
  getRevenueByEvent,
  getDepartmentParticipation,
  getTurnoutRates,
  getClubMembershipOverview,
  getDashboardAnalytics
};
