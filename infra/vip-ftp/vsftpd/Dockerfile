FROM alpine:3.20

RUN apk add --no-cache vsftpd shadow \
  && mkdir -p /var/run/vsftpd/empty /data/music

COPY vsftpd.conf /etc/vsftpd/vsftpd.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 21 21100-21110

ENTRYPOINT ["/entrypoint.sh"]
