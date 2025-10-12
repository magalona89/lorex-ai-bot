// aria-maintenance.js
let isUnderMaintenance = false;

module.exports = {
  getStatus: () => isUnderMaintenance,
  setStatus: (value) => { isUnderMaintenance = value; }
};
