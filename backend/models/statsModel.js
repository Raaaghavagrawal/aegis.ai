const { pool } = require("../config/db");

async function getDashboardStats() {
  const [
    [payoutRows],
    [userPolicyRows],
    [totalUserRows]
  ] = await Promise.all([
    pool.execute("SELECT SUM(amount) AS totalPayouts FROM payouts"),
    pool.execute(`
      SELECT 
        COUNT(t.id) AS activeUsers,
        SUM(t.weekly_income) AS protectedIncome
      FROM (
        SELECT DISTINCT u.id, u.weekly_income
        FROM users u
        INNER JOIN policies p ON p.user_id = u.id
        WHERE p.status = 'active'
      ) AS t`),
    pool.execute("SELECT COUNT(*) AS totalUsers FROM users")
  ]);

  return {
    total_users: Number(totalUserRows[0].totalUsers || 0),
    total_payouts: Number(payoutRows[0].totalPayouts || 0),
    active_users: Number(userPolicyRows[0].activeUsers || 0),
    protected_income: Number(userPolicyRows[0].protectedIncome || 0)
  };
}

module.exports = {
  getDashboardStats
};
