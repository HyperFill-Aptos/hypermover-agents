from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import MCPServerAdapter
from .core.utils import get_groq_key
import os
import time
import litellm


class RetryingLLM(LLM):
    def __init__(self, retries=5, backoff=2, **kwargs):
        super().__init__(**kwargs)
        self.retries = retries
        self.backoff = backoff

    def _safe_tokens(self, messages):
        for m in messages:
            if m.get("content"):
                tokens = len(m["content"].split())
                if tokens > self.max_prompt_tokens:
                    m["content"] = " ".join(m["content"].split()[:self.max_prompt_tokens])
        return messages

    def call(self, *args, **kwargs):
        for i in range(self.retries):
            try:
                return super().call(*args, **kwargs)
            except litellm.RateLimitError as e:
                wait = self.backoff ** i
                print(f"[LLM] Rate limit hit. Waiting {wait}s before retry... ({i+1}/{self.retries})")
                time.sleep(wait)
        raise Exception("LLM call failed after retries due to persistent rate limits.")


def run_market_making_workflow() -> str:
    os.environ["GROQ_API_KEY"] = get_groq_key() or ""
    os.environ["OPENAI_API_BASE"] = "https://api.cerebras.ai/v1/chat/completions"
    os.environ["OPENAI_API_KEY"] = os.getenv("CEREBRAS_API_KEY", "")

    max_response_tokens = 256
    llm = RetryingLLM(
        max_tokens=max_response_tokens,
        retries=5,
        backoff=2,
        model="cerebras/llama-3.3-70b",
        temperature=0.7,
    )

    servers = [
        {"url": "http://localhost:5000/mcp", "transport": "streamable-http"}
    ]

    unified_adapter = MCPServerAdapter([servers[0]])
    unified_tools = unified_adapter.tools

    market_researcher = Agent(
        role="Senior Market Research and Analysis Specialist",
        goal=(
            "Conduct comprehensive market research and analysis across all supported markets. "
            "Identify trading opportunities; analyze orderbooks and spreads for market making."
        ),
        backstory=(
            "Experienced market researcher with deep expertise in crypto markets and market structure."
        ),
        tools=unified_tools,
        verbose=False,
        llm=llm,
        max_iter=4,
    )

    pricer = Agent(
        role="Senior Market Price Strategist",
        goal=(
            "Ascertain vault balance, decide order size, compute mid price based on bid/ask."
        ),
        backstory=(
            "Senior Market Price Strategist with experience in market-making and liquidity analysis."
        ),
        tools=unified_tools,
        verbose=False,
        llm=llm,
        max_iter=4,
    )

    executive_trader = Agent(
        role="Executive Trading Operations Manager",
        goal=(
            "Execute market making operations based on research and pricing analysis; manage assets and bots."
        ),
        backstory=(
            "Seasoned operations manager for automated trading systems and risk management."
        ),
        tools=unified_tools,
        verbose=False,
        llm=llm,
        max_iter=6,
    )

    market_discovery_task = Task(
        description=(
            "Perform market discovery and analysis: list supported markets and fetch orderbooks; "
            "identify spreads and promising pairs."
        ),
        expected_output=(
            "Report containing supported markets, asset breakdown, and one promising asset."
        ),
        agent=market_researcher,
    )

    pricing_task = Task(
        description=(
            "Based on bid/ask, set spread around mid price; decide order size from vault balance."
        ),
        expected_output=(
            "Pricing strategy: order size, pair to enter, optimal spread, mid price and bid/ask."
        ),
        agent=pricer,
    )

    executive_trading_task = Task(
        description=(
            "Execute market making workflow: review research, validate pricing, move funds if needed, "
            "and deploy market maker bot with recommended config."
        ),
        expected_output=(
            "Execution report: asset movement confirmation, bot status, trading pair config and next steps."
        ),
        agent=executive_trader,
        context=[market_discovery_task, pricing_task],
    )

    market_analysis_crew = Crew(
        agents=[market_researcher, pricer],
        tasks=[market_discovery_task, pricing_task],
        verbose=False,
        process=Process.sequential,
        memory=False,
        llm=llm,
    )

    result = market_analysis_crew.kickoff()
    return str(result)


