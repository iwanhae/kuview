# Start by building the application.
FROM golang:1.24-bookworm AS build

WORKDIR /go/src/kuview
COPY . .

ENV CGO_ENABLED=0
RUN go build -o /go/bin/kuview cmd/server/main.go

FROM node:22-alpine AS build-web
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Now copy it into our base image.
FROM gcr.io/distroless/static-debian12
WORKDIR /app
COPY --from=build /go/bin/kuview /app/kuview
COPY --from=build-web /app/dist /app/dist

EXPOSE 8001
CMD ["/app/kuview"]