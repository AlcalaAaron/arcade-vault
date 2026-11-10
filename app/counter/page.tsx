'use client';

import { useState } from 'react';

const COMMANDS: [cmd: string, desc: string][] = [
  ['ls -la', 'Lista archivos y carpetas, incluidos los ocultos, con detalle.'],
  ['pwd', 'Muestra el directorio de trabajo actual.'],
  ['cd ~', 'Cambia al directorio personal del usuario.'],
  ['cat archivo.txt', 'Imprime el contenido de un archivo.'],
  [
    "grep -rn 'texto' .",
    'Busca texto recursivamente mostrando número de línea.',
  ],
  ['chmod +x script.sh', 'Da permiso de ejecución a un archivo.'],
  [
    'chown user:group archivo',
    'Cambia el propietario y el grupo de un archivo.',
  ],
  ['ps aux', 'Lista todos los procesos en ejecución.'],
  ['top', 'Monitor interactivo de procesos y recursos.'],
  ['kill -9 1234', 'Termina a la fuerza el proceso con PID 1234.'],
  ['df -h', 'Muestra el espacio libre de los discos en formato legible.'],
  ['du -sh *', 'Muestra el tamaño de cada elemento del directorio.'],
  [
    'tar -czvf backup.tar.gz carpeta/',
    'Comprime una carpeta en un archivo .tar.gz.',
  ],
  [
    "find . -name '*.log'",
    'Busca archivos por nombre desde el directorio actual.',
  ],
  ['ssh user@host', 'Abre una sesión remota segura en otro equipo.'],
  [
    'curl -I https://example.com',
    'Obtiene solo las cabeceras HTTP de una URL.',
  ],
  ['mkdir -p a/b/c', 'Crea directorios anidados de una sola vez.'],
  [
    'rm -rf carpeta',
    'Elimina una carpeta y su contenido sin preguntar. ¡Cuidado!',
  ],
  ['cp -r origen destino', 'Copia directorios de forma recursiva.'],
  ['mv viejo nuevo', 'Mueve o renombra un archivo o carpeta.'],
  ['tail -f /var/log/syslog', 'Sigue un archivo de log en tiempo real.'],
  ['head -n 20 archivo', 'Muestra las primeras 20 líneas de un archivo.'],
  ['history | tail', 'Muestra los últimos comandos ejecutados.'],
  ['whoami', 'Indica el usuario con el que estás conectado.'],
  ['uname -a', 'Muestra información del kernel y del sistema.'],
  ['free -h', 'Muestra el uso de memoria RAM y swap.'],
  ['ln -s destino enlace', 'Crea un enlace simbólico.'],
  ['sudo apt update', 'Actualiza el índice de paquetes (Debian/Ubuntu).'],
  ['systemctl status nginx', 'Consulta el estado de un servicio con systemd.'],
  ["awk '{print $1}' archivo", 'Imprime la primera columna de cada línea.'],
];

const DOTS = ['bg-red-500', 'bg-yellow-400', 'bg-green-500'];

export default function CounterPage() {
  const [count, setCount] = useState(0);
  const [cmd, desc] = COMMANDS[count % COMMANDS.length];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <p className="font-mono text-sm uppercase tracking-widest opacity-60">
        Contador #{count}
      </p>

      <div className="w-full rounded-lg border border-white/15 bg-black/80 p-6 text-left shadow-lg">
        <div className="mb-4 flex gap-2" aria-hidden="true">
          {DOTS.map((color) => (
            <span key={color} className={`h-3 w-3 rounded-full ${color}`} />
          ))}
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
