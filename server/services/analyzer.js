const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Wait helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check whether the error is temporary and worth retrying
function isRetryableError(error) {
  const status = error?.status || error?.code;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

// Call Gemini with exponential backoff
async function generateWithRetry(model, prompt, config, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🤖 Gemini request: ${model} | attempt ${attempt + 1}/${maxRetries + 1}`
      );

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      console.log(`✅ Gemini success: ${model}`);

      return response;
    } catch (error) {
      lastError = error;

      console.error(
        `❌ Gemini error: ${model} | attempt ${attempt + 1}`,
        error?.status || error?.code || error?.message
      );

      // Don't retry permanent errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // If this wasn't the final attempt, wait before retrying
      if (attempt < maxRetries) {
        const baseDelay = 1500 * Math.pow(2, attempt);

        // Small random jitter prevents repeated requests
        // from hitting Gemini at exactly the same time.
        const jitter = Math.floor(Math.random() * 500);

        const delay = baseDelay + jitter;

        console.log(`⏳ Retrying in ${delay}ms...`);

        await sleep(delay);
      }
    }
  }

  throw lastError;
}

async function analyzeCommunication(message) {
  const prompt = `
You are ProjectPulse, an AI project communication intelligence system
for architecture, design and construction projects.

Analyze the following project communication.

Your job is to identify:

1. A concise project summary
2. Decisions that were made
3. Actions that need to be performed
4. People/stakeholders and their roles
5. Deadlines
6. Dependencies between tasks
7. Important risks or alerts

IMPORTANT RULES:

- Only extract information supported by the communication.
- Do not invent names, deadlines, decisions or responsibilities.
- If information is unknown, use an empty string.
- If there are no items in a category, return an empty array.
- Distinguish between a decision and an action.

- Identify dependencies when one task, decision, approval, drawing,
  material selection, or other event must happen BEFORE another task
  can begin.

- VERY IMPORTANT: Dependency direction must ALWAYS be:
  from = the prerequisite / thing that must happen first
  to = the dependent / thing that happens afterward.

- Never reverse the dependency direction.

- Example:
  If the communication says:
  "The electrical contractor must wait for the revised drawing
  before starting ceiling wiring."

  Then return:
  from = "Issue revised reflected ceiling plan"
  to = "Start ceiling wiring"

  NOT the reverse.

- Another example:
  If the communication says:
  "Contractor should not start fabrication until the revised drawing
  is approved."

  Then return:
  from = "Approval of revised drawing"
  to = "Start fabrication"

- If work is blocked, the blocked task should normally appear in
  the "to" field because it is waiting for the prerequisite in "from".

- The "reason" must explain why the "to" task depends on the "from" task.

- Do not create a dependency unless the communication explicitly
  supports that relationship.

- Keep the output concise and useful for a project manager.

For priority use only:
- High
- Medium
- Low
- Empty string if unknown

For status use only:
- Pending
- In Progress
- Completed
- Blocked
- Empty string if unknown

Return ONLY valid JSON matching the requested structure.

PROJECT COMMUNICATION:

${message}
`;

  const config = {
    temperature: 0.1,
    responseMimeType: "application/json",

    responseSchema: {
      type: "object",

      properties: {
        summary: {
          type: "string",
        },

        decisions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: {
                type: "string",
              },
              source: {
                type: "string",
              },
            },
            required: ["text", "source"],
          },
        },

        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              task: {
                type: "string",
              },
              responsible: {
                type: "string",
              },
              deadline: {
                type: "string",
              },
              priority: {
                type: "string",
              },
              status: {
                type: "string",
              },
            },
            required: [
              "task",
              "responsible",
              "deadline",
              "priority",
              "status",
            ],
          },
        },

        stakeholders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              role: {
                type: "string",
              },
            },
            required: ["name", "role"],
          },
        },

        deadlines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: {
                type: "string",
              },
              deadline: {
                type: "string",
              },
            },
            required: ["item", "deadline"],
          },
        },

        dependencies: {
  type: "array",
  items: {
    type: "object",
    properties: {
      from: {
        type: "string",
        description:
          "The prerequisite or event that must happen first.",
      },
      to: {
        type: "string",
        description:
          "The dependent task or work that can happen afterward.",
      },
      reason: {
        type: "string",
        description:
          "Why the dependent task must wait for the prerequisite.",
      },
    },
    required: ["from", "to", "reason"],
  },
},

        alerts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
              priority: {
                type: "string",
              },
            },
            required: ["message", "priority"],
          },
        },
      },

      required: [
        "summary",
        "decisions",
        "actions",
        "stakeholders",
        "deadlines",
        "dependencies",
        "alerts",
      ],
    },
  };

  // -----------------------------------------
  // MODEL FALLBACK SYSTEM
  // -----------------------------------------

  const models = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
  ];

  let lastError;

  for (const model of models) {
    try {
      const response = await generateWithRetry(
        model,
        prompt,
        config,
        2
      );

      const result = JSON.parse(response.text);

      console.log(`🎯 ProjectPulse analysis completed using ${model}`);

      return {
        ...result,
        sourceMessage: message,
        modelUsed: model,
      };
    } catch (error) {
      lastError = error;

      console.error(
        `⚠️ Model ${model} failed. Trying next model...`
      );

      // If it's a permanent error, don't blindly try other models.
      if (!isRetryableError(error)) {
        throw error;
      }
    }
  }

  // All models failed
  console.error("🚨 All Gemini models failed.");

  throw new Error(
    "Gemini AI is temporarily unavailable. Please try again in a moment."
  );
}

module.exports = {
  analyzeCommunication,
};