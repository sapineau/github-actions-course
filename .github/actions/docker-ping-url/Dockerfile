FROM python:alpine3.19

WORKDIR /usr/src/app

COPY requirements.txt ./

# To inspect python version
RUN python -V

# Install pip + dependencies
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

# Copy everything to our image (except files declared from .dockerignore)
COPY . .

CMD ["python", "/usr/src/app/main.py"]