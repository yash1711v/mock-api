const jsonServer = require("json-server");
const https = require("https");
const path = require("path");
const { URL } = require("url");

const server = jsonServer.create();
const dbFile = path.join(__dirname, "db.json");
const router = jsonServer.router(dbFile);
const middlewares = jsonServer.defaults();
const openRouterApiUrl = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const openRouterApiKey = process.env.OPENROUTER_API_KEY || "";
const openRouterModel = process.env.OPENROUTER_MODEL || "openrouter/free";
const maxChatContextMessages = 12;

const suggestionCatalog = [
  { title: "Summarize my notes", description: "Get a concise summary of your text" },
  { title: "Generate email reply", description: "Create a professional email response" },
  { title: "Explain Flutter state management", description: "Understand Provider, Riverpod, and Bloc" },
  { title: "Write a standup update", description: "Draft a quick daily progress update" },
  { title: "Refine my resume summary", description: "Improve the opening section of your resume" },
  { title: "Create interview questions", description: "Generate technical interview questions" },
  { title: "Plan my study schedule", description: "Build a focused study routine" },
  { title: "Draft a LinkedIn post", description: "Turn your ideas into a polished post" },
  { title: "Simplify technical jargon", description: "Rewrite complex text in plain language" },
  { title: "Brainstorm app features", description: "Explore useful ideas for your next app" },
  { title: "Write release notes", description: "Summarize changes in a clear product update" },
  { title: "Create meeting agenda", description: "Organize topics for your next meeting" },
  { title: "Outline a blog post", description: "Turn a topic into a clear article structure" },
  { title: "Draft push notification copy", description: "Write short and actionable notification text" },
  { title: "Review my API design", description: "Spot gaps in your endpoint structure" },
  { title: "Generate commit message", description: "Write a clean Git commit summary" },
  { title: "Polish customer support reply", description: "Make a support message clearer and friendlier" },
  { title: "Create onboarding checklist", description: "List the first steps for a new teammate" },
  { title: "Turn notes into tasks", description: "Convert meeting notes into action items" },
  { title: "Draft project proposal", description: "Structure a short project pitch" },
  { title: "Summarize an article", description: "Pull out the key points from long content" },
  { title: "Write app store description", description: "Create store copy for your mobile app" },
  { title: "Generate FAQ answers", description: "Draft responses for common user questions" },
  { title: "Create test cases", description: "List practical test scenarios for a feature" },
  { title: "Rewrite for professional tone", description: "Make your writing sound more polished" },
  { title: "Draft follow-up email", description: "Write a clear message after a meeting" },
  { title: "Break down a coding task", description: "Split a feature into smaller implementation steps" },
  { title: "Create social captions", description: "Write short captions for social media posts" },
  { title: "Explain async programming", description: "Understand futures, streams, and async flows" },
  { title: "Review error messages", description: "Improve copy for failures and empty states" },
  { title: "Generate PR description", description: "Summarize code changes for reviewers" },
  { title: "Draft client update", description: "Write a concise progress email for a client" },
  { title: "Plan sprint goals", description: "Define a realistic sprint objective" },
  { title: "Convert bullets to paragraph", description: "Turn rough notes into polished writing" },
  { title: "Create product tagline", description: "Write a short memorable positioning line" },
  { title: "Prepare demo script", description: "Outline a simple product walkthrough" },
  { title: "Summarize meeting transcript", description: "Extract highlights and next steps" },
  { title: "Generate naming ideas", description: "Brainstorm names for a feature or product" },
  { title: "Improve UX microcopy", description: "Make interface text more helpful" },
  { title: "Draft bug report", description: "Describe a bug with clear reproduction steps" },
  { title: "Create acceptance criteria", description: "Define what done looks like for a task" },
  { title: "Explain widget lifecycle", description: "Understand build, update, and dispose phases" },
  { title: "Write learning goals", description: "Set practical targets for a study session" },
  { title: "Generate roadmap themes", description: "Group product ideas into bigger initiatives" },
  { title: "Review copy for clarity", description: "Tighten wording and reduce ambiguity" },
  { title: "Draft feature announcement", description: "Write a user-facing feature launch note" },
  { title: "Turn feedback into action plan", description: "Organize comments into concrete follow-ups" },
  { title: "Create workshop outline", description: "Plan sections for a short teaching session" },
  { title: "Summarize research findings", description: "Highlight the most important insights" },
  { title: "Generate portfolio bio", description: "Write a short professional introduction" },
];

const suggestions = suggestionCatalog.map((item, index) => ({
  id: index + 1,
  title: item.title,
  description: item.description,
}));

server.use(middlewares);
server.use(jsonServer.bodyParser);

function normalizePage(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

function buildAssistantReply(message) {
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    return "Please send a message and I will return a mock assistant reply.";
  }

  if (normalizedMessage.includes("state")) {
    return "State management keeps UI and data in sync. In Flutter, Provider, Riverpod, and Bloc are common ways to structure that flow.";
  }

  if (normalizedMessage.includes("flutter")) {
    return "Flutter lets you build cross-platform apps from one codebase using widgets and a reactive UI model.";
  }

  if (normalizedMessage.includes("email")) {
    return "Here is a mock reply: Thanks for the update. I reviewed the details and will get back to you with the next steps shortly.";
  }

  if (normalizedMessage.includes("summary") || normalizedMessage.includes("summarize")) {
    return "Here is a mock summary: the main idea is captured, the details are condensed, and the next action is clearly identified.";
  }

  if (normalizedMessage.includes("hello") || normalizedMessage.includes("hi")) {
    return "Hello. I am a mock assistant endpoint, so I will return custom canned responses for now.";
  }

  return `Mock assistant reply: I received "${message.trim()}" and generated a placeholder response for the assignment flow.`;
}

function performJsonPost(requestUrl, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(requestUrl);
    const body = JSON.stringify(payload);

    const request = https.request(
      {
        method: "POST",
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        port: url.port || 443,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
      },
      (response) => {
        let rawResponse = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawResponse += chunk;
        });

        response.on("end", () => {
          let parsedResponse = null;

          if (rawResponse) {
            try {
              parsedResponse = JSON.parse(rawResponse);
            } catch (error) {
              reject(new Error("AI provider returned a non-JSON response."));
              return;
            }
          }

          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            const providerMessage =
              typeof parsedResponse?.error?.message === "string"
                ? parsedResponse.error.message
                : `AI provider request failed with status ${response.statusCode || 500}.`;
            const requestError = new Error(providerMessage);

            requestError.code = "AI_PROVIDER_ERROR";
            reject(requestError);
            return;
          }

          resolve(parsedResponse);
        });
      }
    );

    request.on("error", (error) => {
      error.code = "AI_PROVIDER_ERROR";
      reject(error);
    });

    request.write(body);
    request.end();
  });
}

function toOpenRouterRole(sender) {
  if (sender === "assistant") {
    return "assistant";
  }

  return "user";
}

function buildChatContextMessages(message) {
  const priorMessages = getHistoryCollection()
    .slice(-maxChatContextMessages)
    .filter((entry) => typeof entry?.message === "string" && entry.message.trim())
    .map((entry) => ({
      role: toOpenRouterRole(entry.sender),
      content: entry.message.trim(),
    }));

  return [
    {
      role: "system",
      content:
        "You are a concise API assistant. Answer directly, stay practical, and keep responses short unless the user asks for more detail.",
    },
    ...priorMessages,
    {
      role: "user",
      content: message,
    },
  ];
}

function extractReplyText(content) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part.text === "string") {
          return part.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

async function generateAssistantReply(message) {
  if (!openRouterApiKey) {
    return {
      reply: buildAssistantReply(message),
      source: "mock",
      model: null,
    };
  }

  const response = await performJsonPost(
    openRouterApiUrl,
    {
      model: openRouterModel,
      messages: buildChatContextMessages(message),
    },
    {
      Authorization: `Bearer ${openRouterApiKey}`,
    }
  );

  const reply = extractReplyText(response?.choices?.[0]?.message?.content);

  if (!reply) {
    const error = new Error("AI provider returned an empty reply.");

    error.code = "AI_PROVIDER_ERROR";
    throw error;
  }

  return {
    reply,
    source: "openrouter",
    model: typeof response?.model === "string" ? response.model : openRouterModel,
  };
}

function getHistoryCollection() {
  const history = router.db.get("history").value();
  return Array.isArray(history) ? history : [];
}

function persistChatExchange(message, reply) {
  const historyEntries = [
    { sender: "user", message },
    { sender: "assistant", message: reply },
  ];

  router.db.get("history").push(...historyEntries).write();
  router.db.get("chat").push(...historyEntries).write();
}

server.get("/suggestions", (req, res) => {
  const page = normalizePage(req.query.page || req.query.current_page, 1);
  const limit = normalizePage(req.query.limit, 10);
  const totalItems = suggestions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * limit;
  const data = suggestions.slice(startIndex, startIndex + limit);

  res.status(200).json({
    status: "success",
    data,
    pagination: {
      current_page: safePage,
      total_pages: totalPages,
      total_items: totalItems,
      limit,
      has_next: safePage < totalPages,
      has_previous: safePage > 1,
    },
  });
});

server.post("/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    res.status(400).json({
      status: "error",
      message: "The request body must include a non-empty message field.",
    });
    return;
  }

  try {
    const assistantResponse = await generateAssistantReply(message);

    persistChatExchange(message, assistantResponse.reply);

    res.status(200).json({
      status: "success",
      reply: assistantResponse.reply,
      source: assistantResponse.source,
      model: assistantResponse.model,
    });
  } catch (error) {
    const messageText =
      error && typeof error.message === "string"
        ? error.message
        : "Unable to generate a chat response right now.";

    res.status(502).json({
      status: "error",
      message: messageText,
    });
  }
});

server.get("/chat/history", (req, res) => {
  res.status(200).json({
    status: "success",
    data: getHistoryCollection(),
  });
});

server.use(router);

const port = Number.parseInt(process.env.PORT, 10) || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Mock API server is running on port ${port}`);
});
