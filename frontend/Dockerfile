# Use an official Nginx runtime as the base image
FROM nginx:latest

# Copy the static website files to the Nginx web root directory
COPY . /usr/share/nginx/html

# Expose port 8080 for the web server
EXPOSE 80

# Start the Nginx web server
CMD ["nginx", "-g", "daemon off;"]
