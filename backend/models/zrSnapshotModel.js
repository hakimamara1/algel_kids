const mongoose = require('mongoose');

// Last copy of ZR's territories, prices, offices and workflow.
// Used when ZR can't be reached, so the order form never stops working.
const zrSnapshotSchema = new mongoose.Schema({
    _id: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
    fetchedAt: { type: Date },
}, { minimize: false });

module.exports = mongoose.model('ZrSnapshot', zrSnapshotSchema);
