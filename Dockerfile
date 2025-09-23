FROM ubuntu:22.04

# NOTE: Optimized for Azure Container Registry and Azure App Service deployment

# Install system dependencies
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    wget git curl \
    # Python and PostgreSQL dependencies
    python3 python3-pip python-is-python3 \
    libpq-dev postgresql-client \
    build-essential \
    # PDF processing
    poppler-utils ghostscript \
    # Java for FOP
    default-jre \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Node.js 20.x (Current LTS, best Azure App Service support)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Download and install FOP
RUN wget -q -O fop.tgz 'http://www.apache.org/dyn/closer.cgi?filename=/xmlgraphics/fop/binaries/fop-2.4-bin.tar.gz&action=download' \
    && tar zxf fop.tgz \
    && rm -f fop.tgz \
    && mv fop-2.4 /usr/local/share

ENV PATH=/usr/local/share/fop-2.4/fop:$PATH

WORKDIR /app

# Copy package files for better Docker layer caching
COPY package*.json ./

RUN npm install

# Install Node.js dependencies (including sass locally)
RUN npm ci --no-audit --ignore-scripts --omit=dev \
    && npm install sass --save-dev \
    && npm cache clean --force

# Add node_modules/.bin to PATH so Django can find sass
ENV PATH="/app/node_modules/.bin:$PATH"

# Upgrade pip
RUN pip install --upgrade pip

# Install Python dependencies first (for better caching)
COPY requirements*.txt* setup.py setup.cfg pyproject.toml* ./
RUN pip install psycopg2-binary==2.9.9

# Copy application code
COPY . .

# Install application
RUN pip install -e .

# Set environment variables for Azure App Service
ENV PORT=8000
ENV DJANGO_SETTINGS_MODULE=indigo.settings
ENV PYTHONPATH=/app

# Verify sass installation and compile SCSS
RUN which sass && sass --version
RUN python manage.py compilescss

# Collect static files
RUN python manage.py collectstatic --noinput -i docs -i \*.scss

# Create non-root user for security (Azure App Service best practice)
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port for Azure App Service
EXPOSE 8000

# Use gunicorn for production (recommended for Azure App Service)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "indigo.wsgi:application"]