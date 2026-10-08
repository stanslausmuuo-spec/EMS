const express = require('express');
const router = express.Router();
const { captureLead, getExhibitorLeads, updateLead, exportLeadsCSV } = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Exhibitor', 'Organizer', 'Admin'));

router.post('/capture', captureLead);
router.get('/', getExhibitorLeads);
router.get('/export', exportLeadsCSV);
router.put('/:id', updateLead);

module.exports = router;
