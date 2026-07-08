FROM python:3.13-slim

RUN apt-get update && apt-get install -y nodejs npm && \
    npm install -g snarkjs && \
    apt-get clean

WORKDIR /app

COPY . .

RUN pip install --upgrade pip && \
    pip install "pandas<3.0.0" && \
    pip install -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
