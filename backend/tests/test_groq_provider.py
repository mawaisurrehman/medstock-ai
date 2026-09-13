from app.core.config import get_settings


def test_groq_settings_defaults_exist_for_openai_compatible_client():
    settings = get_settings()
    assert settings.groq_base_url == "https://api.groq.com/openai/v1"
    assert settings.groq_model == "llama-3.3-70b-versatile"
    assert isinstance(settings.groq_api_key, str)


def test_groq_client_module_imports():
    import app.ai.groq_client as groq_client

    assert hasattr(groq_client, "generate_response")
