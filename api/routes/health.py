from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def root():
    return {"service": "arxify.ai", "version": "0.1.0", "docs": "/docs"}


@router.get("/health")
def health():
    return {"ok": True}
