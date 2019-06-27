FROM nginx
EXPOSE 80
COPY site/ /usr/share/nginx/html
