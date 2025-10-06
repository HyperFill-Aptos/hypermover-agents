from fastapi import FastAPI
from pydantic import BaseModel
from .workflow import run_market_making_workflow


class RunResponse(BaseModel):
    status: str
    result: str | None = None
    error: str | None = None


app = FastAPI(title="Hypermover Client API", version="1.0.0")


@app.post("/crew/run", response_model=RunResponse)
def crew_run():
    try:
        result = run_market_making_workflow()
        return RunResponse(status="ok", result=result)
    except Exception as e:
        return RunResponse(status="error", error=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


