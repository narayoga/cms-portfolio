<?php
declare(strict_types=1);

namespace App;

class Router
{
    private array $routes = [];

    public function add(string $method, string $pattern, callable|array $handler): void
    {
        $this->routes[] = [strtoupper($method), $pattern, $handler];
    }

    public function get(string $p, callable|array $h): void    { $this->add('GET', $p, $h); }
    public function post(string $p, callable|array $h): void   { $this->add('POST', $p, $h); }
    public function put(string $p, callable|array $h): void    { $this->add('PUT', $p, $h); }
    public function delete(string $p, callable|array $h): void { $this->add('DELETE', $p, $h); }

    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);
        // strip query string and trailing slash
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $path = rtrim($path, '/') ?: '/';

        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        foreach ($this->routes as [$m, $pattern, $handler]) {
            if ($m !== $method) continue;
            $regex = $this->compile($pattern);
            if (preg_match($regex, $path, $matches)) {
                $params = array_filter($matches, fn($k) => !is_int($k), ARRAY_FILTER_USE_KEY);
                if (is_array($handler)) {
                    [$class, $action] = $handler;
                    $instance = new $class();
                    $instance->$action($params);
                } else {
                    $handler($params);
                }
                return;
            }
        }
        Response::error('Not found', 404);
    }

    private function compile(string $pattern): string
    {
        $regex = preg_replace('#:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $pattern);
        return '#^' . $regex . '$#';
    }
}
