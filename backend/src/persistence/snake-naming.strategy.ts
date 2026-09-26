import { DefaultNamingStrategy } from 'typeorm';

/**
 * Convierte los nombres de las propiedades de la entidad (camelCase) a
 * snake_case para las columnas de Postgres: boardSize -> board_size.
 *
 * Se hereda de DefaultNamingStrategy para que solo se cambie el nombre de las
 * columnas; el resto de nombres (claves primarias, indices, constraints) los
 * sigue generando TypeORM.
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy {
  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    const name = customName ?? propertyName;
    return embeddedPrefixes
      .map((prefix) => this.toSnakeCase(prefix))
      .join('') + this.toSnakeCase(name);
  }

  private toSnakeCase(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .toLowerCase();
  }
}
