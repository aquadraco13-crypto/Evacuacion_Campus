FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY src ./src
COPY web ./web
RUN mkdir out && javac -encoding UTF-8 -d out src/*.java
# Detrás del proxy del hosting: usar la IP real y marcar la cookie como Secure
ENV TRUST_PROXY=1
# La clave se pone en el panel del hosting como variable ADMIN_CLAVE (no en el repositorio)
CMD ["java", "-Dstdout.encoding=UTF-8", "-cp", "out", "Servidor"]
