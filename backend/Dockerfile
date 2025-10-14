FROM php:8.3-apache

RUN apt-get update && apt-get install -y \
    git unzip libpng-dev libonig-dev libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl

RUN a2enmod rewrite

# Serve Laravel from public/ directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf

WORKDIR /var/www/html
COPY . /var/www/html

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Ensure .env exists and APP_KEY is set
RUN set -ex \
    && if [ ! -f .env ]; then \
        echo "APP_NAME=Laravel" > .env \
        && echo "APP_ENV=local" >> .env \
        && echo "APP_KEY=" >> .env \
        && echo "APP_DEBUG=true" >> .env \
        && echo "APP_URL=http://localhost" >> .env \
        && echo "DB_CONNECTION=mysql" >> .env \
        && echo "DB_HOST=mysql" >> .env \
        && echo "DB_PORT=3306" >> .env \
        && echo "DB_DATABASE=iguan" >> .env \
        && echo "DB_USERNAME=iguan" >> .env \
        && echo "DB_PASSWORD=iguan" >> .env; \
    fi \
    && php artisan key:generate --force

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80
CMD ["apache2-foreground"]
