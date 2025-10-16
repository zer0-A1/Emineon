import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Collection of inspirational quotes for recruitment professionals
    const quotes = [
      {
        text: "Great companies are built by great people, and great people are found by great recruiters.",
        author: "Anonymous",
        category: "recruitment"
      },
      {
        text: "Talent wins games, but teamwork and intelligence win championships.",
        author: "Michael Jordan",
        category: "teamwork"
      },
      {
        text: "The best way to predict the future is to create it by hiring the right people.",
        author: "Peter Drucker (adapted)",
        category: "hiring"
      },
      {
        text: "In the end, it's not about finding a job, it's about finding the right fit.",
        author: "Anonymous",
        category: "matching"
      },
      {
        text: "Every person you hire either helps or hurts your company culture.",
        author: "Tony Hsieh",
        category: "culture"
      },
      {
        text: "Recruiting is not about filling positions, it's about building futures.",
        author: "Anonymous",
        category: "purpose"
      },
      {
        text: "The art of recruitment is finding extraordinary people hiding in ordinary places.",
        author: "Anonymous",
        category: "discovery"
      },
      {
        text: "A-players hire A-players. B-players hire C-players.",
        author: "Steve Jobs",
        category: "excellence"
      },
      {
        text: "Your network is your net worth, especially in recruitment.",
        author: "Porter Gale (adapted)",
        category: "networking"
      },
      {
        text: "The right person in the right role can change everything.",
        author: "Anonymous",
        category: "impact"
      },
      { text: "Hire for attitude, train for skill.", author: "Herb Kelleher", category: "principle" },
      { text: "Culture eats strategy for breakfast.", author: "Peter Drucker", category: "culture" },
      { text: "If you think hiring professionals is expensive, try hiring amateurs.", author: "Red Adair", category: "excellence" },
      { text: "Diversity is being invited to the party; inclusion is being asked to dance.", author: "Verna Myers", category: "inclusion" },
      { text: "People rarely succeed unless they have fun in what they are doing.", author: "Dale Carnegie", category: "motivation" },
      { text: "Do not hire a man who does your work for money, but him who does it for love of it.", author: "Henry David Thoreau", category: "purpose" },
      { text: "The secret of my success is that we have gone to exceptional lengths to hire the best people in the world.", author: "Steve Jobs", category: "excellence" },
      { text: "Treat employees like they make a difference and they will.", author: "Jim Goodnight", category: "engagement" },
      { text: "Train people well enough so they can leave, treat them well enough so they don’t want to.", author: "Richard Branson", category: "retention" },
      { text: "Time spent on hiring is time well spent.", author: "Robert Half", category: "hiring" },
      { text: "An organization’s ability to learn, and translate that learning into action rapidly, is the ultimate competitive advantage.", author: "Jack Welch", category: "learning" }
    ];

    // Pick a random quote on every request
    const today = new Date();
    const dailyQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Add some recruitment tips based on the day
    const tips = [
      "Focus on candidate experience - every interaction matters",
      "Use data-driven insights to improve your hiring process",
      "Build relationships before you need them",
      "Personalize your outreach for better response rates",
      "Always follow up, but respect boundaries",
      "Quality over quantity in candidate sourcing",
      "Embrace technology, but don't lose the human touch"
    ];
    
    const tipIndex = Math.floor(Math.random() * tips.length);

    return NextResponse.json({
      success: true,
      data: {
        quote: {
          text: dailyQuote.text,
          author: dailyQuote.author,
          category: dailyQuote.category
        },
        tip: tips[tipIndex],
        date: today.toISOString().split('T')[0],
        message: "Stay motivated and keep building great teams!"
      },
      message: "Daily quote retrieved successfully"
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Daily quote API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch daily quote',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
} 