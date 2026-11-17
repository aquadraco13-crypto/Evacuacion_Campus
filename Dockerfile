FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY src ./src
COPY web ./web
COPY lib ./lib
RUN mkdir out && javac -encoding UTF-8 -d out -sourcepath src src/evacuacion/Main.java
# Detrás del proxy del hosting: usar la IP real y marcar la cookie como Secure
ENV TRUST_PROXY=1
# DATABASE_URL (postgres://usuario:clave@servidor:5432/base) se pone también en el panel del hosting;
# sin ella el sistema guarda todo en memoria.
# La clave se pone en el panel del hosting como variable ADMIN_CLAVE (no en el repositorio)
CMD ["java", "-Dstdout.encoding=UTF-8", "-cp", "out:lib/postgresql-42.7.2.jar", "evacuacion.Main"]
