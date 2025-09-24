#!/usr/bin/env python3
import os
from typing import Any, Dict

from flask import Flask, render_template, request, jsonify
import requests


def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static")

    # Configure backend API base URL
    app.config["RAG_API_BASE"] = os.getenv("RAG_API_BASE", "http://127.0.0.1:8000")

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/health")
    def health():
        try:
            resp = requests.get(f"{app.config['RAG_API_BASE']}/health", timeout=15)
            return jsonify(resp.json()), resp.status_code
        except Exception as exc:
            return jsonify({"status": "error", "detail": str(exc)}), 500

    @app.route("/chat", methods=["POST"])
    def chat():
        data: Dict[str, Any] = request.get_json(force=True, silent=True) or {}
        payload = {
            "query": data.get("query", ""),
            "max_context_chunks": data.get("max_context_chunks", 5),
            "model": data.get("model"),
            # Forward session and structured selections so backend can personalize and persist
            "session_id": data.get("session_id"),
            "selections": data.get("selections"),
        }
        try:
            resp = requests.post(f"{app.config['RAG_API_BASE']}/chat", json=payload, timeout=60)
            return jsonify(resp.json()), resp.status_code
        except Exception as exc:
            return jsonify({"answer": f"Error contacting backend: {exc}", "citations": [], "retrieval_metadata": {"error": str(exc)}}), 500

    @app.get("/components")
    def list_components():
        return jsonify({
            "supported": [
                "button_group_what_chatbot",
                "button_group_channels",
                "button_group_audience",
                "contact_form",
                "book_demo",
            ]
        })

    @app.get("/components/<tag>")
    def component_def(tag: str):
        tag = tag.strip().lower()
        if tag == "button_group_what_chatbot":
            return jsonify({
                "type": "button_group",
                "title": "What kind of chatbot are you looking for?",
                "selectionKey": "what_chatbot",
                "options": [
                    {"label": "Customer Support", "value": "support"},
                    {"label": "Sales Assistant", "value": "sales"},
                    {"label": "Internal Helpdesk", "value": "helpdesk"},
                    {"label": "Workflow Automation", "value": "automation"},
                ]
            })
        if tag == "button_group_channels":
            return jsonify({
                "type": "button_group",
                "title": "Which channels?",
                "selectionKey": "channels",
                "options": [
                    {"label": "Web", "value": "web"},
                    {"label": "Mobile", "value": "mobile"},
                    {"label": "WhatsApp/SMS", "value": "whatsapp_sms"},
                    {"label": "Slack", "value": "slack"},
                    {"label": "Teams", "value": "teams"},
                    {"label": "Voice", "value": "voice"},
                ]
            })
        if tag == "button_group_audience":
            return jsonify({
                "type": "button_group",
                "title": "Who will use it?",
                "selectionKey": "audience",
                "options": [
                    {"label": "Customers", "value": "customers"},
                    {"label": "Prospects", "value": "prospects"},
                    {"label": "Partners", "value": "partners"},
                    {"label": "Employees", "value": "employees"},
                    {"label": "Agents", "value": "agents"},
                ]
            })
        if tag == "contact_form":
            return jsonify({
                "type": "contact_form",
                "title": "Share your contact details",
                "fields": ["name", "email", "company", "note"],
                "selectionKey": "contact"
            })
        if tag == "book_demo":
            return jsonify({
                "type": "link",
                "title": "Book a Demo",
                "href": "https://cal.com"
            })
        return jsonify({"error": "Unknown component"}), 404

    return app


app = create_app()


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5050"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() in {"1", "true", "yes"}
    app.run(host=host, port=port, debug=debug)


