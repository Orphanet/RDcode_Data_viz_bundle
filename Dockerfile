FROM python:3.8-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./requirements.txt .

RUN pip3 install --no-cache-dir -r requirements.txt

COPY ./media/ ./media/
COPY ./swagger_server/ ./swagger_server/

WORKDIR /usr/src/app/swagger_server

ENV PYTHONPATH "${PYTHONPATH}:/usr/src/app"

EXPOSE 8080

ENTRYPOINT ["python3"]

CMD ["./API_main.py"]

# Build with:
# docker build -t rdcode_bundle:{ver} . --label rdcode_bundle:{ver}

# Run with:
# docker run -p 8080:8080 --name rdcode_bundle_{ver} rdcode_bundle:{ver}

# Export with:
# docker save rdcode_bundle:{ver} -o ./rdcode_bundle_{ver}

# Load with:
# docker load -i {path}\rdcode_bundle_{ver}