# Use official Node LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the port your app uses
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
