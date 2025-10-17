FROM python:3.13.7-slim

WORKDIR /flask_api

ENV FLASK_APP=api.py
ENV FLASK_RUN_HOST=0.0.0.0

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["flask", "run", "--no-debugger"]