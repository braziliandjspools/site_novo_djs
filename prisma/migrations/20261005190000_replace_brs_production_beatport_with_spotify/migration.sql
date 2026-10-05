-- Produções BRS: o link externo opcional é Spotify, não Beatport.
ALTER TABLE "brs_productions" ADD COLUMN "spotify_url" TEXT;
ALTER TABLE "brs_productions" DROP COLUMN "beatport_url";
