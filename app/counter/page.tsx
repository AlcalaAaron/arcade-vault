'use client';

import { useState } from 'react';

const COMMANDS = [
  {
    cmd: 'ls -la',
    desc: 'Lista archivos y carpetas, incluidos los ocultos, con detalle.',
  },
  { cmd: 'pwd', desc: 'Muestra el directorio de trabajo actual.' },
  { cmd: 'cd ~', desc: 'Cambia al directorio personal del usuario.' },
  { cmd: 'cat archivo.txt', desc: 'Imprime el contenido de un archivo.' },
  {
    cmd: "grep -rn 'texto' .",
    desc: 'Busca texto recursivamente mostrando número de línea.',
  },
  { cmd: 'chmod +x script.sh', desc: 'Da permiso de ejecución a un archivo.' },
  {
    cmd: 'chown user:group archivo',
    desc: 'Cambia el propietario y el grupo de un archivo.',
  },
  { cmd: 'ps aux', desc: 'Lista todos los procesos en ejecución.' },
  { cmd: 'top', desc: 'Monitor interactivo de procesos y recursos.' },
  { cmd: 'kill -9 1234', desc: 'Termina a la fuerza el proceso con PID 1234.' },
  {
    cmd: 'df -h',
    desc: 'Muestra el espacio libre de los discos en formato legible.',
  },
  {
    cmd: 'du -sh *',
    desc: 'Muestra el tamaño de cada elemento del directorio.',
  },
  {
    cmd: 'tar -czvf backup.tar.gz carpeta/',
    desc: 'Comprime una carpeta en un archivo .tar.gz.',
  },
  {
    cmd: "find . -name '*.log'",
    desc: 'Busca archivos por nombre desde el directorio actual.',
  },
  {
    cmd: 'ssh user@host',
    desc: 'Abre una sesión remota segura en otro equipo.',
  },
  {
    cmd: 'curl -I https://example.com',
    desc: 'Obtiene solo las cabeceras HTTP de una URL.',
  },
  { cmd: 'mkdir -p a/b/c', desc: 'Crea directorios anidados de una sola vez.' },
  {
    cmd: 'rm -rf carpeta',
    desc: 'Elimina una carpeta y su contenido sin preguntar. ¡Cuidado!',
  },
  {
    cmd: 'cp -r origen destino',
    desc: 'Copia directorios de forma recursiva.',
  },
  { cmd: 'mv viejo nuevo', desc: 'Mueve o renombra un archivo o carpeta.' },
  {
    cmd: 'tail -f /var/log/syslog',
    desc: 'Sigue un archivo de log en tiempo real.',
  },
  {
    cmd: 'head -n 20 archivo',
    desc: 'Muestra las primeras 20 líneas de un archivo.',
  },
  { cmd: 'history | tail', desc: 'Muestra los últimos comandos ejecutados.' },
  { cmd: 'whoami', desc: 'Indica el usuario con el que estás conectado.' },
  { cmd: 'uname -a', desc: 'Muestra información del kernel y del sistema.' },
  { cmd: 'free -h', desc: 'Muestra el uso de memoria RAM y swap.' },
  { cmd: 'ln -s destino enlace', desc: 'Crea un enlace simbólico.' },
  {
    cmd: 'sudo apt update',
    desc: 'Actualiza el índice de paquetes (Debian/Ubuntu).',
  },
  {
    cmd: 'systemctl status nginx',
    desc: 'Consulta el estado de un servicio con systemd.',
  },
  {
    cmd: "awk '{print $1}' archivo",
    desc: 'Imprime la primera columna de cada línea.',
  },
];

export default function CounterPage() {
  const [count, setCount] = useState(0);
  const { cmd, desc } = COMMANDS[count % COMMANDS.length];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <p className="font-mono text-sm uppercase tracking-widest opacity-60">
        Contador #{count}
      </p>

      <div className="w-full rounded-lg border border-white/15 bg-black/80 p-6 text-left shadow-lg">
        <div className="mb-4 flex gap-2" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <p className="break-all font-mono text-xl text-green-400 sm:text-2xl">
          <span className="select-none opacity-60">$ </span>
          {cmd}
        </p>
        <p className="mt-4 text-sm text-white/70">{desc}</p>
      </div>

      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-md bg-green-500 px-6 py-3 font-mono font-bold text-black transition hover:bg-green-400 active:scale-95"
      >
        +1
      </button>
    </main>
  );
}
