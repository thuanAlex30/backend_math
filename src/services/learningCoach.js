/**
 * Learning Coach AI Service
 * Provides personalized coaching and learning recommendations
 */

import { chatComplete } from './hfRouter.js';
import User from '../models/User.js';

/**
 * Analyze practice history and generate coaching insights
 */
async function analyzePracticeHistory(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) throw new Error('User not found');
    
    const practiceHistory = user.practiceHistory || [];
    
    if (practiceHistory.length === 0) {
      return {
        message: 'Keep practicing! We need more data to provide personalized coaching.',
        insights: [],
        recommendations: ['Start with easier problems', 'Practice daily for better results']
      };
    }
    
    // Calculate statistics
    const stats = {
      totalProblems: practiceHistory.length,
      correctCount: practiceHistory.filter(p => p.isCorrect).length,
      averageTimeSeconds: practiceHistory.reduce((sum, p) => sum + (p.timeSeconds || 0), 0) / practiceHistory.length,
      byDifficulty: {},
      byTopic: {},
      recentPerformance: practiceHistory.slice(-10)
    };
    
    // Group by difficulty and topic
    practiceHistory.forEach(problem => {
      const difficulty = problem.difficulty || 'unknown';
      const topic = problem.topic || 'unknown';
      
      if (!stats.byDifficulty[difficulty]) {
        stats.byDifficulty[difficulty] = { total: 0, correct: 0 };
      }
      if (!stats.byTopic[topic]) {
        stats.byTopic[topic] = { total: 0, correct: 0 };
      }
      
      stats.byDifficulty[difficulty].total++;
      stats.byTopic[topic].total++;
      
      if (problem.isCorrect) {
        stats.byDifficulty[difficulty].correct++;
        stats.byTopic[topic].correct++;
      }
    });
    
    // Calculate success rates
    stats.overallSuccessRate = (stats.correctCount / stats.totalProblems * 100).toFixed(2);
    stats.recentSuccessRate = (stats.recentPerformance.filter(p => p.isCorrect).length / stats.recentPerformance.length * 100).toFixed(2);
    
    // Find weak areas
    const weakAreas = Object.entries(stats.byTopic)
      .map(([topic, data]) => ({
        topic,
        successRate: (data.correct / data.total * 100).toFixed(2),
        totalProblems: data.total
      }))
      .filter(area => area.successRate < 60)
      .sort((a, b) => a.successRate - b.successRate);
    
    // Find strong areas
    const strongAreas = Object.entries(stats.byTopic)
      .map(([topic, data]) => ({
        topic,
        successRate: (data.correct / data.total * 100).toFixed(2),
        totalProblems: data.total
      }))
      .filter(area => area.successRate >= 80)
      .sort((a, b) => b.successRate - a.successRate);
    
    return {
      stats,
      weakAreas,
      strongAreas,
      insights: generateInsights(stats, weakAreas, strongAreas),
      recommendations: generateRecommendations(stats, weakAreas, strongAreas)
    };
  } catch (error) {
    console.error('Error analyzing practice history:', error);
    throw error;
  }
}

/**
 * Generate personalized coaching message
 */
async function generateCoachingMessage(userId, focusArea = null) {
  try {
    const analysis = await analyzePracticeHistory(userId);
    const user = await User.findById(userId);
    
    const studentName = user?.name?.split(' ')[0] || 'Student';
    const isDemoMode = process.env.HUGGINGFACE_API_KEY === 'demo_mode';
    
    let message;
    
    if (isDemoMode) {
      // Demo mode response
      message = generateDemoCoachingMessage(studentName, analysis, focusArea);
    } else {
      // Use AI to generate personalized message
      try {
        const prompt = buildCoachingPrompt(studentName, analysis, focusArea);
        const response = await chatComplete([
          { role: 'system', content: 'You are a supportive math tutor. Generate personalized coaching messages for students.' },
          { role: 'user', content: prompt }
        ]);
        message = extractCoachingMessage(response);
      } catch (error) {
        console.warn('AI generation failed, using template:', error.message);
        message = generateDemoCoachingMessage(studentName, analysis, focusArea);
      }
    }
    
    return {
      message,
      timestamp: new Date(),
      focusArea: focusArea || analysis.weakAreas[0]?.topic,
      nextSteps: generateNextSteps(analysis, focusArea)
    };
  } catch (error) {
    console.error('Error generating coaching message:', error);
    throw error;
  }
}

/**
 * Get personalized practice recommendations
 */
async function getPersonalizedRecommendations(userId) {
  try {
    const analysis = await analyzePracticeHistory(userId);
    const user = await User.findById(userId);
    
    const recommendations = [];
    
    // Focus on weak areas
    if (analysis.weakAreas.length > 0) {
      analysis.weakAreas.slice(0, 3).forEach(area => {
        recommendations.push({
          type: 'focus-weak-area',
          title: `Master ${area.topic}`,
          description: `Your success rate in ${area.topic} is ${area.successRate}%. Let's improve this!`,
          difficulty: 'medium',
          estimatedTime: 15,
          priority: 'high'
        });
      });
    }
    
    // Challenge with strong areas
    if (analysis.strongAreas.length > 0) {
      recommendations.push({
        type: 'challenge-strong-area',
        title: `Challenge: Advanced ${analysis.strongAreas[0].topic}`,
        description: `You're excellent at ${analysis.strongAreas[0].topic}! Try harder problems.`,
        difficulty: 'hard',
        estimatedTime: 20,
        priority: 'medium'
      });
    }
    
    // Spaced repetition
    if (user?.mathSRCards?.length > 0) {
      const dueCards = user.mathSRCards.filter(card => {
        const nextReviewDate = new Date(card.nextReviewDate);
        return nextReviewDate <= new Date();
      });
      
      if (dueCards.length > 0) {
        recommendations.push({
          type: 'spaced-repetition',
          title: `Review ${dueCards.length} topics`,
          description: `You have ${dueCards.length} topics due for review in your spaced repetition schedule.`,
          difficulty: 'easy',
          estimatedTime: 10,
          priority: 'high'
        });
      }
    }
    
    // Consistency bonus
    const daysSinceLastPractice = calculateDaysSinceLastPractice(analysis.stats.recentPerformance);
    if (daysSinceLastPractice > 1) {
      recommendations.push({
        type: 'consistency',
        title: 'Get back on track',
        description: `You haven't practiced in ${daysSinceLastPractice} days. Daily practice is key to improvement!`,
        difficulty: 'easy',
        estimatedTime: 5,
        priority: 'high'
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

// Helper functions
function generateInsights(stats, weakAreas, strongAreas) {
  const insights = [];
  
  if (stats.overallSuccessRate >= 80) {
    insights.push(`Great job! You have an ${stats.overallSuccessRate}% overall success rate.`);
  } else if (stats.overallSuccessRate >= 60) {
    insights.push(`Good progress! You're at ${stats.overallSuccessRate}%. Keep practicing!`);
  } else {
    insights.push(`You're at ${stats.overallSuccessRate}%. Focus on fundamentals to improve.`);
  }
  
  if (stats.recentSuccessRate > stats.overallSuccessRate) {
    insights.push('📈 Your recent performance is improving! Keep up the momentum.');
  } else if (stats.recentSuccessRate < stats.overallSuccessRate) {
    insights.push('📉 Recent performance has dipped. Try breaking problems into smaller steps.');
  }
  
  if (stats.averageTimeSeconds > 180) {
    insights.push('⏱️ You\'re taking longer on problems. Try to work faster by practicing more.');
  }
  
  return insights;
}

function generateRecommendations(stats, weakAreas, strongAreas) {
  const recommendations = [];
  
  if (weakAreas.length > 0) {
    recommendations.push(`Focus on ${weakAreas[0].topic} - your weakest area`);
  }
  
  if (stats.recentSuccessRate < 50) {
    recommendations.push('Slow down and focus on one concept at a time');
  }
  
  recommendations.push('Practice spaced repetition for long-term retention');
  recommendations.push('Challenge yourself with harder problems in your strong areas');
  
  return recommendations;
}

function generateDemoCoachingMessage(studentName, analysis, focusArea) {
  const messages = [
    `Hello ${studentName}! I've reviewed your practice history and I'm impressed by your dedication! You're doing great work. Your overall success rate is ${analysis.stats.overallSuccessRate}%, which shows solid progress.`,
    `Hi ${studentName}! Looking at your recent work, I notice you're improving steadily. Keep focusing on the areas where you struggle - that's where real growth happens!`,
    `${studentName}, your practice shows consistent effort. You're particularly strong in ${analysis.strongAreas[0]?.topic || 'several areas'}. Let's now master ${analysis.weakAreas[0]?.topic || 'some more challenging topics'}.`
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

function buildCoachingPrompt(studentName, analysis, focusArea) {
  return `As a math tutor, provide a personalized coaching message to ${studentName}.
  
Their stats:
- Overall success rate: ${analysis.stats.overallSuccessRate}%
- Recent success rate: ${analysis.stats.recentSuccessRate}%
- Total problems solved: ${analysis.stats.totalProblems}
- Weak areas: ${analysis.weakAreas.map(a => a.topic).join(', ') || 'none identified'}
- Strong areas: ${analysis.strongAreas.map(a => a.topic).join(', ') || 'various topics'}

Provide an encouraging, personalized message that acknowledges their progress and gives specific guidance on what to focus on next. Keep it to 2-3 sentences.`;
}

function extractCoachingMessage(response) {
  // Response from chatComplete is already a string
  if (typeof response === 'string') {
    return response;
  }
  // Fallback for any other format
  return response.toString();
}

function generateNextSteps(analysis, focusArea) {
  const steps = [];
  
  if (analysis.weakAreas.length > 0) {
    steps.push(`Review concepts in ${analysis.weakAreas[0].topic}`);
    steps.push(`Practice 10 problems on ${analysis.weakAreas[0].topic}`);
  }
  
  steps.push('Review past mistakes');
  steps.push('Try increasingly difficult problems');
  
  return steps;
}

function calculateDaysSinceLastPractice(recentPerformance) {
  if (recentPerformance.length === 0) return 999;
  
  const lastPractice = new Date(recentPerformance[recentPerformance.length - 1].date);
  const today = new Date();
  const diffTime = Math.abs(today - lastPractice);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export {
  analyzePracticeHistory,
  generateCoachingMessage,
  getPersonalizedRecommendations
};
