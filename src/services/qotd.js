/**
 * Question of the Day (QotD) Service
 * Manages daily question generation and leaderboard
 */

import mongoose from 'mongoose';
import { buildMathPrompt } from './practice.js';
import { chatComplete } from './hfRouter.js';
import User from '../models/User.js';

/**
 * Create or get today's question
 */
async function getTodayQuestion() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have a question for today
    let qotd = await getQotDFromStorage(today);
    
    if (qotd) {
      return qotd;
    }
    
    // Generate a new question for today
    qotd = await generateDailyQuestion(today);
    return qotd;
  } catch (error) {
    console.error('Error getting today question:', error);
    // Return a fallback question
    return getFallbackQuestion();
  }
}

/**
 * Generate a new daily question
 */
async function generateDailyQuestion(dateString) {
  try {
    const isDemoMode = process.env.HUGGINGFACE_API_KEY === 'demo_mode';
    
    // Generate or select a question
    let question;
    
    if (isDemoMode) {
      question = getRandomDemoQuestion();
    } else {
      // Use the practice service to generate a question
      const difficulty = selectDifficultyForQotD();
      const topic = selectTopicForQotD();
      
      try {
        const grade = 6; // Default grade for QotD
        const prompt = buildMathPrompt(grade, topic, 1);
        
        const response = await chatComplete([
          { role: 'system', content: 'You are a math teacher. Generate a single math problem with solution and explanation. Format the response as JSON with fields: problem, solution, explanation.' },
          { role: 'user', content: prompt }
        ]);
        const generatedText = extractGeneratedQuestion(response);
        
        question = {
          problem: generatedText.problem || 'What is 2 + 2?',
          difficulty: difficulty,
          topic: topic,
          solution: generatedText.solution || 'The answer is 4',
          explanation: generatedText.explanation || 'This is a basic arithmetic problem'
        };
      } catch (error) {
        console.warn('Question generation failed:', error.message);
        question = getRandomDemoQuestion();
      }
    }
    
    // Store the question
    const qotd = {
      _id: new mongoose.Types.ObjectId(),
      dateString: dateString,
      problem: question.problem,
      difficulty: question.difficulty || 'medium',
      topic: question.topic || 'algebra',
      solution: question.solution,
      explanation: question.explanation,
      submissions: [],
      leaderboard: [],
      createdAt: new Date(dateString)
    };
    
    // Store in database (via User model or dedicated QotD storage)
    // For now, we'll return it (in production, save to a QotD collection)
    return qotd;
  } catch (error) {
    console.error('Error generating daily question:', error);
    return getFallbackQuestion();
  }
}

/**
 * Submit an answer to the question of the day
 */
async function submitQotDAnswer(userId, questionDate, answer, timeSeconds) {
  try {
    const user = await User.findById(userId);
    
    if (!user) throw new Error('User not found');
    if (!user.qotdSubmissions) user.qotdSubmissions = [];
    
    // Check if already submitted today
    const today = new Date().toISOString().split('T')[0];
    const existingSubmission = user.qotdSubmissions.find(s => s.dateString === today);
    
    if (existingSubmission) {
      throw new Error('You have already submitted an answer today');
    }
    
    // Get today's question
    const question = await getTodayQuestion();
    
    // Evaluate the answer (basic check - in production, use AI validation)
    const isCorrect = validateAnswer(answer, question.solution);
    
    // Record submission
    const submission = {
      _id: new mongoose.Types.ObjectId(),
      dateString: today,
      answer: answer,
      isCorrect: isCorrect,
      timeSeconds: timeSeconds,
      submittedAt: new Date(),
      points: calculateQotDPoints(isCorrect, timeSeconds)
    };
    
    user.qotdSubmissions.push(submission);
    
    // Add to QotD leaderboard entry if correct
    if (isCorrect) {
      if (!user.qotdStats) {
        user.qotdStats = {
          correctCount: 0,
          streak: 0,
          totalPoints: 0,
          lastSubmissionDate: null
        };
      }
      
      user.qotdStats.correctCount++;
      user.qotdStats.totalPoints += submission.points;
      
      // Check for streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const hasYesterdaySubmission = user.qotdSubmissions.some(s => 
        s.dateString === yesterdayStr && s.isCorrect
      );
      
      if (hasYesterdaySubmission) {
        user.qotdStats.streak++;
      } else {
        user.qotdStats.streak = 1;
      }
      
      user.qotdStats.lastSubmissionDate = today;
    }
    
    await user.save();
    
    return {
      submission,
      isCorrect,
      explanation: question.explanation,
      correctAnswer: question.solution,
      points: submission.points
    };
  } catch (error) {
    console.error('Error submitting QotD answer:', error);
    throw error;
  }
}

/**
 * Get QotD leaderboard for today
 */
async function getQotDLeaderboard(limit = 50) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const users = await User.find({}, {
      name: 1,
      avatar: 1,
      qotdSubmissions: 1,
      qotdStats: 1,
      grade: 1
    });
    
    const todayEntries = users
      .map(user => {
        const submission = (user.qotdSubmissions || []).find(s => s.dateString === today);
        const stats = user.qotdStats || {};
        
        return {
          userId: user._id,
          name: user.name || 'Anonymous',
          avatar: user.avatar,
          grade: user.grade,
          todayCorrect: submission?.isCorrect || false,
          todayTime: submission?.timeSeconds || null,
          todayPoints: submission?.points || 0,
          totalStreak: stats.streak || 0,
          totalCorrect: stats.correctCount || 0,
          totalPoints: stats.totalPoints || 0
        };
      })
      .filter(entry => entry.todayCorrect || entry.totalCorrect > 0)
      .sort((a, b) => {
        // Sort by today's correctness, then by streak, then by total points
        if (a.todayCorrect !== b.todayCorrect) {
          return b.todayCorrect - a.todayCorrect;
        }
        if (a.totalStreak !== b.totalStreak) {
          return b.totalStreak - a.totalStreak;
        }
        return b.totalPoints - a.totalPoints;
      })
      .slice(0, limit);
    
    return {
      dateString: today,
      leaderboard: todayEntries
    };
  } catch (error) {
    console.error('Error getting QotD leaderboard:', error);
    throw error;
  }
}

/**
 * Get user's QotD statistics
 */
async function getUserQotDStats(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) throw new Error('User not found');
    
    const submissions = user.qotdSubmissions || [];
    const stats = user.qotdStats || {
      correctCount: 0,
      streak: 0,
      totalPoints: 0,
      lastSubmissionDate: null
    };
    
    // Calculate additional stats
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const submission = submissions.find(s => s.dateString === dateStr);
      last7Days.unshift({
        date: dateStr,
        correct: submission?.isCorrect || false,
        points: submission?.points || 0
      });
    }
    
    return {
      ...stats,
      totalSubmissions: submissions.length,
      successRate: submissions.length > 0 ? ((stats.correctCount / submissions.length) * 100).toFixed(2) : 0,
      last7Days: last7Days,
      averageTimeSeconds: submissions.length > 0 
        ? (submissions.reduce((sum, s) => sum + (s.timeSeconds || 0), 0) / submissions.length).toFixed(2)
        : 0
    };
  } catch (error) {
    console.error('Error getting user QotD stats:', error);
    throw error;
  }
}

// Helper functions
function getQotDFromStorage(dateString) {
  // In production, fetch from database
  // For now, return null to generate new question
  return null;
}

function getFallbackQuestion() {
  return {
    _id: new mongoose.Types.ObjectId(),
    dateString: new Date().toISOString().split('T')[0],
    problem: 'If a train travels 60 km/h and needs to cover 300 km, how long will it take?',
    difficulty: 'medium',
    topic: 'algebra',
    solution: '5 hours',
    explanation: 'Distance = Speed × Time, so Time = Distance / Speed = 300 / 60 = 5 hours',
    submissions: [],
    leaderboard: [],
    createdAt: new Date()
  };
}

function getRandomDemoQuestion() {
  const questions = [
    {
      problem: 'If x + 5 = 12, what is the value of x?',
      difficulty: 'easy',
      topic: 'algebra',
      solution: '7',
      explanation: 'Subtract 5 from both sides: x = 12 - 5 = 7'
    },
    {
      problem: 'What is the area of a circle with radius 5?',
      difficulty: 'medium',
      topic: 'geometry',
      solution: '78.5 square units',
      explanation: 'Area = πr² = π × 5² = 25π ≈ 78.5'
    },
    {
      problem: 'Solve: 2x² - 8 = 0',
      difficulty: 'medium',
      topic: 'algebra',
      solution: 'x = 2 or x = -2',
      explanation: '2x² = 8, x² = 4, x = ±2'
    },
    {
      problem: 'What is 15% of 80?',
      difficulty: 'easy',
      topic: 'percentage',
      solution: '12',
      explanation: '15% × 80 = 0.15 × 80 = 12'
    },
    {
      problem: 'Find the value: 3⁴ - 2³',
      difficulty: 'easy',
      topic: 'exponents',
      solution: '73',
      explanation: '3⁴ = 81, 2³ = 8, so 81 - 8 = 73'
    }
  ];
  
  return questions[Math.floor(Math.random() * questions.length)];
}

function selectDifficultyForQotD() {
  const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
}

function selectTopicForQotD() {
  const topics = ['algebra', 'geometry', 'percentage', 'arithmetic', 'exponents', 'fractions'];
  return topics[Math.floor(Math.random() * topics.length)];
}

function extractGeneratedQuestion(response) {
  try {
    // Response from chatComplete is already a string
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        return {
          problem: response,
          solution: 'See explanation',
          explanation: response
        };
      }
    }
  } catch (error) {
    console.warn('Error extracting generated question:', error);
  }
  
  return getRandomDemoQuestion();
}

function validateAnswer(userAnswer, correctAnswer) {
  // Simple validation - in production, use more sophisticated comparison
  const userClean = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
  const correctClean = correctAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Direct match
  if (userClean === correctClean) return true;
  
  // Try numeric comparison
  const userNum = parseFloat(userAnswer);
  const correctNum = parseFloat(correctAnswer);
  
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    // Allow 1% tolerance for numeric answers
    return Math.abs(userNum - correctNum) / correctNum <= 0.01;
  }
  
  return false;
}

function calculateQotDPoints(isCorrect, timeSeconds) {
  if (!isCorrect) return 0;
  
  // Base points: 50
  // Bonus for speed: up to 50 points
  // Max time for bonus: 300 seconds
  const speedBonus = Math.max(0, 50 * (1 - timeSeconds / 300));
  return Math.round(50 + speedBonus);
}

export {
  getTodayQuestion,
  generateDailyQuestion,
  submitQotDAnswer,
  getQotDLeaderboard,
  getUserQotDStats
};
