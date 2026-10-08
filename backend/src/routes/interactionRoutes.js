const express = require('express');
const router = express.Router();
const {
  getSessionPolls,
  createPoll,
  votePoll,
  getSessionQuestions,
  askQuestion,
  upvoteQuestion
} = require('../controllers/interactionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/session/:sessionId/polls', getSessionPolls);
router.post('/session/:sessionId/polls', protect, authorize('Organizer', 'Admin'), createPoll);
router.post('/polls/vote', protect, votePoll);

router.get('/session/:sessionId/questions', getSessionQuestions);
router.post('/session/:sessionId/questions', protect, askQuestion);
router.post('/questions/:questionId/upvote', protect, upvoteQuestion);

module.exports = router;
