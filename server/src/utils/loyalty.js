function calculateLoyaltyPoints(amount) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0;
  }

  return Math.floor(numericAmount / 100);
}

function getMembershipTier(points = 0) {
  const numericPoints = Number(points || 0);

  if (numericPoints > 300) return 'Platinum';
  if (numericPoints > 200) return 'Gold';
  if (numericPoints > 100) return 'Silver';
  return 'Bronze';
}

module.exports = {
  calculateLoyaltyPoints,
  getMembershipTier,
};
