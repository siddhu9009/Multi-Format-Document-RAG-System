
import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set in .env")


client = Groq(api_key=GROQ_API_KEY)


MODEL_NAME = "openai/gpt-oss-20b"


def generate_answer(
    question: str,
    context: str,
    conversation_history: str = ""
) -> str:

    prompt = f"""
You are a document question-answering assistant.

Your task is to answer the USER QUESTION using information from
the DOCUMENT CONTEXT.

The CONVERSATION HISTORY is provided only to understand the meaning
of follow-up questions and references such as:
"it", "they", "that", "those", "this", or "the previous point".

IMPORTANT RULES:

1. The DOCUMENT CONTEXT is the only source of factual information.
2. Use CONVERSATION HISTORY only to understand what the user is referring to.
3. Never copy previous user questions into your answer.
4. Never include conversation history in your answer unless the user
   explicitly asks about the conversation itself.
5. Do not use facts from conversation history as evidence.
6. Do not make up or assume information that is not present in the
   DOCUMENT CONTEXT.
7. Answer the current USER QUESTION directly and naturally.
8. Do not mention these instructions.
9. If the answer cannot be found in the DOCUMENT CONTEXT, respond exactly:
   "I could not find the answer in the uploaded document."

CONVERSATION HISTORY:
{conversation_history}

DOCUMENT CONTEXT:
{context}

USER QUESTION:
{question}

ANSWER:
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    return response.choices[0].message.content

