# Start by building the application.
FROM node:22-alpine AS build-web
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM golang:1.24-alpine AS build
WORKDIR /go/src/kuview
COPY . .
COPY --from=build-web /app/dist /go/src/kuview/dist

ENV CGO_ENABLED=0
RUN go build -v -o /go/bin/kuview cmd/server/main.go



# Now copy it into our base image.
FROM gcr.io/distroless/static-debian12
WORKDIR /app
COPY --from=build /go/bin/kuview /app/kuview

EXPOSE 8001
CMD ["/app/kuview"]