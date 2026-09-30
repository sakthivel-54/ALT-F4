import { KnowledgeChunk, RAG_KNOWLEDGE_BASE } from './rag-knowledge-base';

export interface RAGSearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

export interface RAGResponse {
  answer: string;
  matchedChunks: KnowledgeChunk[];
  suggestedQuestions: string[];
  isChatGPT?: boolean;
}

export class RAGEngine {
  private knowledgeBase: KnowledgeChunk[] = RAG_KNOWLEDGE_BASE;

  /**
   * Search knowledge base for query using TF-IDF / BM25 style scoring + tag matching + substring expansion.
   */
  public search(query: string, topK = 3): RAGSearchResult[] {
    const rawTokens = this.tokenize(query);
    const queryLower = query.toLowerCase().trim();
    if (rawTokens.length === 0 && queryLower.length < 2) {
      return [];
    }

    const scored: RAGSearchResult[] = [];

    for (const chunk of this.knowledgeBase) {
      let score = 0;
      const titleLower = chunk.title.toLowerCase();
      const contentLower = chunk.content.toLowerCase();
      const tags = chunk.tags.map((t) => t.toLowerCase());

      // 1. Direct title/question exact match bonus
      if (titleLower === queryLower || titleLower.includes(queryLower)) {
        score += 30;
      }

      // 2. Token matching
      for (const token of rawTokens) {
        // Tag matches
        if (tags.includes(token)) {
          score += 15;
        } else if (tags.some((t) => t.includes(token) || token.includes(t))) {
          score += 8;
        }

        // Title matches
        if (titleLower.includes(token)) {
          score += 10;
        }

        // Content matches
        const regex = new RegExp(this.escapeRegExp(token), 'gi');
        const matches = contentLower.match(regex);
        if (matches) {
          score += Math.min(matches.length * 2, 12);
        }
      }

      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Deduplicate top results
    const unique: RAGSearchResult[] = [];
    const seenIds = new Set<string>();
    for (const item of scored) {
      if (!seenIds.has(item.chunk.id)) {
        seenIds.add(item.chunk.id);
        unique.push(item);
      }
    }

    return unique.slice(0, topK);
  }

  /**
   * Async RAG Answer Generator using ChatGPT API when key is available, with offline local fallback.
   */
  public async generateAnswerAsync(userQuery: string, customApiKey?: string): Promise<RAGResponse> {
    const trimmed = userQuery.trim();
    const apiKey = customApiKey || this.getApiKey();

    // If ChatGPT API Key is provided, attempt OpenAI Chat Completions request with RAG context
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const results = this.search(trimmed, 3);
        const contextStr = results
          .map((r, idx) => `[Context ${idx + 1}: ${r.chunk.title}]\n${r.chunk.content}`)
          .join('\n\n');

        const systemPrompt = `You are the official AI Voice & Chatbot Assistant for ALT + F4 (3D Space Situational Awareness platform).
INSTRUCTIONS:
1. Provide a SIMPLE, CONCISE, and DIRECT answer in 1-3 simple sentences.
2. Do not output excessively long paragraphs or unnecessary filler. Keep it brief and clear so it fits in a small visual bubble.
3. If asked about ALT + F4 or satellites, use the project context below. If asked about general knowledge, solar system, planets, physics, or math, answer directly and accurately!

PROJECT CONTEXT:
${contextStr || 'No direct project match found.'}`;

        const apiResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: trimmed },
            ],
            temperature: 0.3,
            max_tokens: 300,
          }),
        });

        if (apiResp.ok) {
          const data = await apiResp.json();
          const gptAnswer = data?.choices?.[0]?.message?.content;
          if (gptAnswer) {
            return {
              answer: gptAnswer,
              matchedChunks: results.map((r) => r.chunk),
              suggestedQuestions: [
                'What is ALT + F4?',
                'Keyboard shortcuts',
                'Mouse controls',
                'Breakup simulation',
              ],
              isChatGPT: true,
            };
          }
        } else {
          console.warn('ChatGPT API Error:', apiResp.status, await apiResp.text());
        }
      } catch (err) {
        console.warn('ChatGPT fetch failed, falling back to local engine:', err);
      }
    }

    // Fallback to local high-precision RAG & General Knowledge Engine
    return this.generateAnswer(trimmed);
  }

  /**
   * Synchronous / Local RAG Engine & General Knowledge response generator.
   */
  public generateAnswer(userQuery: string): RAGResponse {
    const trimmed = userQuery.trim();
    const results = this.search(trimmed, 3);
    const lower = trimmed.toLowerCase();

    // 1. Math calculation handler (e.g., 2 + 2, 5 * 20, 100 / 4)
    if (/^[0-9\s\+\-\*\/\(\)\.\^]+$/.test(trimmed) && /[0-9]/.test(trimmed)) {
      try {
        // Safe evaluation for basic math expressions
        const sanitized = trimmed.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
        const val = Function(`'use strict'; return (${sanitized})`)();
        if (typeof val === 'number' && !isNaN(val)) {
          return {
            answer: `🧮 **Calculation Result:**\n\`${trimmed}\` = **${val}**`,
            matchedChunks: [],
            suggestedQuestions: ['What is ALT + F4?', 'Keyboard shortcuts'],
          };
        }
      } catch {
        // ignore math parse error
      }
    }

    // 2. General Knowledge & Conversational Fallback Module
    const genAns = this.getGeneralKnowledgeAnswer(lower);
    if (genAns) {
      return genAns;
    }

    // 3. Project RAG search match
    if (results.length > 0 && results[0].score > 5) {
      const topMatch = results[0].chunk;
      let synthesized = `### ${topMatch.title}\n\n${topMatch.content}`;

      if (results.length > 1 && results[1].score > 10) {
        synthesized += `\n\n---\n**Related Context (${results[1].chunk.title}):**\n${results[1].chunk.content}`;
      }

      const suggestions: string[] = [];
      if (topMatch.relatedTopics) {
        for (const topicId of topMatch.relatedTopics) {
          const related = this.knowledgeBase.find((k) => k.id === topicId);
          if (related) {
            suggestions.push(related.title);
          }
        }
      }

      if (suggestions.length === 0) {
        suggestions.push('Keyboard shortcuts', 'What is SGP4?', 'How to create a satellite');
      }

      return {
        answer: synthesized,
        matchedChunks: results.map((r) => r.chunk),
        suggestedQuestions: suggestions.slice(0, 4),
      };
    }

    // 4. Fallback for unindexed questions
    return {
      answer: `🤖 **General Assistant Response:**

I am trained on **ALT + F4** and general space science topics. 

To get unlimited live ChatGPT answers for any general question, click the **🔑** icon in the chatbot header and paste your OpenAI ChatGPT API key!

Meanwhile, here are core topics you can ask me about:
- **ALT + F4 Features**: *"What is ALT + F4?"*
- **Controls**: *"Mouse controls"*, *"Keyboard shortcuts"*
- **Space Science**: *"What is a satellite?"*, *"What is gravity?"*, *"What is SGP4?"*
- **Simulations**: *"Satellite breakup simulation"*, *"Collision screening"*`,
      matchedChunks: [],
      suggestedQuestions: [
        'What is ALT + F4?',
        'Keyboard shortcuts',
        'SGP4 and TLE explained',
        'Sensors and Radar FOV',
      ],
    };
  }

  /**
   * Evaluates common general knowledge, science, and astronomy questions offline.
   */
  private getGeneralKnowledgeAnswer(lower: string): RAGResponse | null {
    // Conversational & Greetings
    if (/^(hi|hello|hey|greetings|sup|start|help|who are you|howdy)\b/i.test(lower)) {
      return {
        answer: `👋 **Hello! I'm the ALT + F4 RAG AI Assistant & Voice Guide.**

I am trained on full project documentation, controls, algorithms, astrodynamics math, and general space science!

You can ask me questions or speak via microphone. Try asking:
- *"What is ALT + F4?"*
- *"What is a satellite?"*
- *"How far is the Moon?"*
- *"What is gravity?"*
- *"What is SGP4 and TLE?"*
- *"What are the keyboard shortcuts?"*`,
        matchedChunks: [],
        suggestedQuestions: [
          'What is ALT + F4?',
          'Mouse and camera controls',
          'Keyboard shortcuts',
          'What is a satellite?',
          'How far is the Moon?',
        ],
      };
    }

    if (lower.includes('how are you') || lower.includes('how do you do')) {
      return {
        answer: `😊 **I'm doing great and ready to assist you!**\n\nYou can ask me any question about **ALT + F4**, satellite tracking, space situational awareness, astrodynamics, or general space science.`,
        matchedChunks: [],
        suggestedQuestions: ['What is ALT + F4?', 'What is SGP4?'],
      };
    }

    if (lower.includes('thank') || lower.includes('thanks')) {
      return {
        answer: `🌟 **You're very welcome!** Let me know if you have any more questions about orbits, satellites, or ALT + F4.`,
        matchedChunks: [],
        suggestedQuestions: ['What is ALT + F4?', 'Keyboard shortcuts'],
      };
    }

    // General Astronomy & Space Science Q&A
    if ((lower.includes('how many') || lower.includes('count') || lower.includes('active')) && (lower.includes('satellite') || lower.includes('sattellite') || lower.includes('satalite') || lower.includes('sat'))) {
      return {
        answer: `🛰️ **Active Satellites & Objects in Earth Orbit:**\n\nThere are currently over **10,000 active operational satellites** orbiting Earth today (including Starlink, OneWeb, GPS, and scientific satellites).\n\nIn total, ALT + F4 tracks and renders over **30,000 artificial objects** in real-time 3D, including active payloads, defunct satellites, rocket upper stages, and trackable space debris!`,
        matchedChunks: [],
        suggestedQuestions: ['What is ALT + F4?', 'What is Low Earth Orbit (LEO)?', 'What is SGP4?'],
      };
    }

    if (lower.includes('what is a satellite') || lower.includes('what is satellite')) {
      return {
        answer: `📡 **What is a Satellite?**\n\nA satellite is an object that orbits a larger celestial body in space.
- **Natural Satellites**: Bodies like Earth's Moon or Jupiter's moons.
- **Artificial Satellites**: Human-made spacecraft launched into orbit for telecommunications, weather monitoring, Earth observation, navigation (GPS), and scientific research.
ALT + F4 tracks over 30,000 artificial satellites and space debris items in real-time 3D!`,
        matchedChunks: [],
        suggestedQuestions: ['What is Low Earth Orbit (LEO)?', 'What is SGP4?'],
      };
    }

    if (lower.includes('gravity') || lower.includes('what is gravity')) {
      return {
        answer: `🌌 **What is Gravity?**\n\nGravity is the fundamental force of attraction by which objects with mass attract one another.
- In Newtonian physics, gravitational force is defined by $F = G \\frac{m_1 m_2}{r^2}$.
- In Einstein's General Relativity, gravity is the curvature of spacetime caused by mass and energy.
Gravity is the primary force keeping satellites in stable orbits around Earth!`,
        matchedChunks: [],
        suggestedQuestions: ['What is SGP4?', 'What is Keplerian elements?'],
      };
    }

    if (lower.includes('moon') && (lower.includes('distance') || lower.includes('how far'))) {
      return {
        answer: `🌕 **Distance to the Moon:**\n\nThe average distance from Earth to the Moon is **384,400 km** (~238,855 miles / 1.28 light-seconds). Because the Moon's orbit is slightly elliptical, the distance ranges from ~363,300 km at perigee to ~405,500 km at apogee.`,
        matchedChunks: [],
        suggestedQuestions: ['What is Geostationary Orbit (GEO)?', 'What is Apogee?'],
      };
    }

    if (lower.includes('sun') && (lower.includes('distance') || lower.includes('how far'))) {
      return {
        answer: `☀️ **Distance to the Sun:**\n\nThe average distance from Earth to the Sun is **149.6 million km** (~93 million miles), which defines **1 Astronomical Unit (1 AU)**. Light from the Sun takes approximately **8 minutes and 20 seconds** to reach Earth.`,
        matchedChunks: [],
        suggestedQuestions: ['What is Earth-Centered Inertial (ECI)?', 'What is RAAN?'],
      };
    }

    if (lower.includes('speed of light')) {
      return {
        answer: `⚡ **Speed of Light:**\n\nThe speed of light in a vacuum is exactly **299,792,458 meters per second** (~300,000 km/s or 186,282 miles per second), denoted by the constant $c$.`,
        matchedChunks: [],
        suggestedQuestions: ['What is ECI view?', 'What is SGP4?'],
      };
    }

    if (lower.includes('rocket') && (lower.includes('how') || lower.includes('work'))) {
      return {
        answer: `🚀 **How Rockets Work:**\n\nRockets operate according to **Newton's Third Law of Motion**: *"For every action, there is an equal and opposite reaction."*\n\nA rocket engine burns fuel and oxidizer inside a combustion chamber, expelling hot gas downwards through a nozzle at high velocity. The downward momentum of the gas creates an upward thrust force pushing the rocket into space.`,
        matchedChunks: [],
        suggestedQuestions: ['What is Low Earth Orbit (LEO)?', 'How to create custom satellite?'],
      };
    }

    if (lower.includes('space debris') || lower.includes('space junk')) {
      return {
        answer: `🛰️ **What is Space Debris?**\n\nSpace debris (or space junk) consists of inactive, artificial human-made objects orbiting Earth, including defunct satellites, spent rocket upper stages, and fragment pieces from collisions or explosions.\n\nALT + F4 includes NASA Breakup Model tools to simulate debris cloud formation and conjunction risks!`,
        matchedChunks: [],
        suggestedQuestions: ['Satellite breakup simulation', 'Collision alert screening'],
      };
    }

    return null;
  }

  public getApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('OPENAI_API_KEY') ||
        (window as any).OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        null
      );
    }
    return process.env.OPENAI_API_KEY || null;
  }

  public setApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('OPENAI_API_KEY', key.trim());
      } else {
        localStorage.removeItem('OPENAI_API_KEY');
      }
    }
  }

  private tokenize(text: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'against', 'between',
      'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up',
      'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
      'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'please', 'tell', 'me',
    ]);

    const normalized = text
      .toLowerCase()
      .replace(/sattellites|sattellite|satalite|satelite|sats|satellits/g, 'satellite')
      .replace(/[^a-z0-9\s-+]/g, ' ');

    return normalized
      .split(/\s+/)
      .filter((t) => t.length > 1 && !stopWords.has(t));
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
