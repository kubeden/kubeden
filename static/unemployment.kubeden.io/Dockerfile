FROM nginx:alpine

# Serve the provided static page via nginx on port 80
COPY index.html /usr/share/nginx/html/index.html
COPY assets/* /usr/share/nginx/html/index.html

EXPOSE 80
