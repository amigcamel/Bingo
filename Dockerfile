FROM nginx:1.18.0-alpine
ENV TZ Asia/Taipei
COPY dist /usr/share/nginx/html/
COPY nginx/conf.d /etc/nginx/conf.d
RUN apk add --no-cache tzdata \
  && ln -sfn /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone
VOLUME ["/nginx/share/nginx//html"]

