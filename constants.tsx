
import { Language } from './types';

export const SUPPORTED_LANGUAGES = [
  { id: Language.PYTHON, name: 'Python', extension: 'py' },
  { id: Language.JAVASCRIPT, name: 'JavaScript', extension: 'js' },
  { id: Language.C, name: 'C', extension: 'c' },
  { id: Language.CPP, name: 'C++', extension: 'cpp' },
  { id: Language.JAVA, name: 'Java', extension: 'java' },
  { id: Language.CSHARP, name: 'C#', extension: 'cs' },
  { id: Language.RUST, name: 'Rust', extension: 'rs' },
  { id: Language.LUA, name: 'Lua', extension: 'lua' },
  { id: Language.RUBY, name: 'Ruby', extension: 'rb' },
  { id: Language.GO, name: 'Go', extension: 'go' },
  { id: Language.SWIFT, name: 'Swift', extension: 'swift' },
];

export const LANGUAGE_KEYWORDS: Record<Language, string[]> = {
  [Language.PYTHON]: ['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield', 'print', 'len', 'range', 'input', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple'],
  [Language.JAVASCRIPT]: ['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'console', 'log', 'window', 'document', 'JSON', 'parse', 'stringify', 'Math', 'Array', 'Object', 'Promise'],
  [Language.C]: ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', 'printf', 'scanf', 'malloc', 'free', 'include', 'define'],
  [Language.CPP]: ['alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit', 'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast', 'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch', 'synchronized', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq', 'std', 'cout', 'cin', 'endl', 'vector', 'string', 'map'],
  [Language.JAVA]: ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'System', 'out', 'println', 'String', 'Integer', 'ArrayList', 'HashMap'],
  [Language.CSHARP]: ['abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while', 'Console', 'WriteLine', 'List', 'Task'],
  [Language.RUST]: ['as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'import', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield', 'println', 'vec', 'String', 'Option', 'Result'],
  [Language.LUA]: ['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while', 'print', 'pairs', 'ipairs', 'table', 'math', 'string', 'io'],
  [Language.RUBY]: ['BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?', 'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until', 'when', 'while', 'yield', 'puts', 'gets', 'chomp', 'attr_accessor', 'require'],
  [Language.GO]: ['break', 'default', 'func', 'interface', 'select', 'case', 'defer', 'go', 'map', 'struct', 'chan', 'else', 'goto', 'package', 'switch', 'const', 'fallthrough', 'if', 'range', 'type', 'continue', 'for', 'import', 'return', 'var', 'fmt', 'Println', 'Printf', 'make', 'append', 'len', 'panic', 'recover'],
  [Language.SWIFT]: ['associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate', 'func', 'import', 'init', 'inout', 'internal', 'let', 'open', 'operator', 'private', 'protocol', 'public', 'rethrows', 'static', 'struct', 'subscript', 'typealias', 'var', 'break', 'case', 'continue', 'default', 'defer', 'do', 'else', 'fallthrough', 'for', 'if', 'in', 'repeat', 'return', 'switch', 'where', 'while', 'Any', 'as', 'catch', 'false', 'is', 'nil', 'rethrows', 'self', 'Self', 'super', 'throw', 'throws', 'true', 'try', 'print', 'String', 'Int', 'Double', 'Array', 'Dictionary'],
};

export const BOILERPLATE: Record<Language, string> = {
  [Language.PYTHON]: `def main():\n    name = input("Enter your name: ")\n    print(f"Hello, {name}!")\n\nif __name__ == "__main__":\n    main()`,
  [Language.JAVASCRIPT]: `function main() {\n    const name = "World";\n    console.log("Hello, " + name + "!");\n}\n\nmain();`,
  [Language.C]: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  [Language.CPP]: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  [Language.JAVA]: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  [Language.CSHARP]: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
  [Language.RUST]: `fn main() {\n    println!("Hello, World!");\n}`,
  [Language.LUA]: `print("Hello, World!")`,
  [Language.RUBY]: `def main\n  puts "Enter your name: "\n  name = gets.chomp\n  puts "Hello, #{name}!"\nend\n\nmain`,
  [Language.GO]: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  [Language.SWIFT]: `import Foundation\n\nprint("Hello, World!")`,
};
